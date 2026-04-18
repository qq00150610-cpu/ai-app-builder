const { getDB, getRedis } = require('../config/database');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const OSS = require('ali-oss');

// 提交构建任务
async function submit(req, res) {
  try {
    const { project_id, app_name, package_name, icon } = req.body;
    
    // 检查打包限制
    const canBuild = await checkBuildLimit(req.user.id);
    if (!canBuild.allowed) {
      return res.status(403).json({ success: false, message: canBuild.message });
    }
    
    const db = getDB();
    
    // 获取项目配置
    const [projects] = await db.query('SELECT * FROM projects WHERE id = ? AND user_id = ?', [project_id, req.user.id]);
    if (!projects[0]) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }
    
    // 创建构建任务
    const [result] = await db.query(
      `INSERT INTO build_tasks (project_id, user_id, status, created_at)
       VALUES (?, ?, 0, NOW())`,
      [project_id, req.user.id]
    );
    
    const taskId = result.insertId;
    
    // 异步执行构建
    executeBuild(taskId, projects[0], { app_name, package_name, icon });
    
    res.json({
      success: true,
      data: { task_id: taskId, message: '构建任务已提交' }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 查询构建状态
async function getStatus(req, res) {
  try {
    const { taskId } = req.params;
    const db = getDB();
    
    const [tasks] = await db.query(
      'SELECT * FROM build_tasks WHERE id = ? AND user_id = ?',
      [taskId, req.user.id]
    );
    
    if (!tasks[0]) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }
    
    res.json({ success: true, data: tasks[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 获取构建历史
async function getHistory(req, res) {
  try {
    const { page = 1, size = 20 } = req.query;
    const db = getDB();
    
    const [tasks] = await db.query(
      `SELECT bt.*, p.name as project_name 
       FROM build_tasks bt 
       LEFT JOIN projects p ON bt.project_id = p.id
       WHERE bt.user_id = ? 
       ORDER BY bt.created_at DESC 
       LIMIT ? OFFSET ?`,
      [req.user.id, parseInt(size), (page - 1) * size]
    );
    
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 下载APK
async function download(req, res) {
  try {
    const { taskId } = req.params;
    const db = getDB();
    
    const [tasks] = await db.query(
      'SELECT * FROM build_tasks WHERE id = ? AND user_id = ? AND status = 2',
      [taskId, req.user.id]
    );
    
    if (!tasks[0] || !tasks[0].apk_url) {
      return res.status(404).json({ success: false, message: 'APK不存在' });
    }
    
    res.json({ success: true, data: { download_url: tasks[0].apk_url } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 取消构建
async function cancel(req, res) {
  try {
    const { taskId } = req.params;
    const db = getDB();
    
    await db.query(
      'UPDATE build_tasks SET status = 4 WHERE id = ? AND user_id = ? AND status IN (0, 1)',
      [taskId, req.user.id]
    );
    
    res.json({ success: true, message: '已取消' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 检查打包限制
async function checkBuildLimit(userId) {
  const db = getDB();
  const [users] = await db.query('SELECT member_type, member_expire_at FROM users WHERE id = ?', [userId]);
  const user = users[0];
  
  // 永久会员
  if (user.member_type === 2) {
    return { allowed: true };
  }
  
  // 年费会员
  if (user.member_type === 1 && new Date(user.member_expire_at) > new Date()) {
    return { allowed: true };
  }
  
  // 免费用户检查每日限制
  const [[{ count }]] = await db.query(
    `SELECT COUNT(*) as count FROM build_tasks 
     WHERE user_id = ? AND DATE(created_at) = CURDATE() AND status != 4`,
    [userId]
  );
  
  if (count >= 1) {
    return { allowed: false, message: '免费用户每日仅可打包1次，请升级会员' };
  }
  
  return { allowed: true };
}

// 执行构建（异步）
async function executeBuild(taskId, project, config) {
  const db = getDB();
  
  try {
    // 更新状态为编译中
    await db.query('UPDATE build_tasks SET status = 1 WHERE id = ?', [taskId]);
    
    // 生成项目文件
    const projectDir = `./temp/build_${taskId}`;
    await generateProjectFiles(projectDir, project, config);
    
    // TODO: 实际编译过程 - 调用编译服务或使用模板
    // 这里模拟编译过程
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 生成APK文件路径（实际需要编译服务）
    const apkFileName = `${config.app_name || 'app'}_${taskId}.apk`;
    const apkUrl = await uploadToOSS(`${projectDir}/app.apk`, apkFileName);
    
    // 更新状态为成功
    await db.query(
      'UPDATE build_tasks SET status = 2, apk_url = ?, completed_at = NOW() WHERE id = ?',
      [apkUrl, taskId]
    );
    
  } catch (error) {
    // 更新状态为失败
    await db.query(
      'UPDATE build_tasks SET status = 3, error_msg = ? WHERE id = ?',
      [error.message, taskId]
    );
  }
}

// 生成项目文件
async function generateProjectFiles(dir, project, config) {
  const fs = require('fs');
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // 生成基础Android项目结构
  const projectConfig = JSON.parse(project.config || '{}');
  
  // AndroidManifest.xml
  const manifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${config.package_name || 'com.aiapp.builder'}">
    <application
        android:label="${config.app_name || 'AI App'}"
        android:icon="@mipmap/ic_launcher">
        <activity android:name=".MainActivity">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
    </application>
</manifest>`;
  
  fs.writeFileSync(`${dir}/AndroidManifest.xml`, manifest);
  
  // 保存项目配置
  fs.writeFileSync(`${dir}/project.json`, JSON.stringify({
    ...projectConfig,
    app_name: config.app_name,
    package_name: config.package_name
  }, null, 2));
}

// 上传到OSS
async function uploadToOSS(filePath, fileName) {
  try {
    const client = new OSS({
      region: process.env.OSS_REGION,
      accessKeyId: process.env.OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
      bucket: process.env.OSS_BUCKET
    });
    
    const result = await client.put(`apks/${fileName}`, filePath);
    return result.url;
  } catch (error) {
    console.error('OSS上传失败:', error);
    return `https://example.com/apks/${fileName}`; // 模拟URL
  }
}

module.exports = { submit, getStatus, getHistory, download, cancel };
