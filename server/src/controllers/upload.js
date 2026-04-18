const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../config/database');

// 引入AI控制器中的方法
const aiController = require('./ai');

/**
 * 上传项目文件或ZIP包
 */
async function uploadProject(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请上传文件' });
    }

    const file = req.file;
    const uploadId = uuidv4();
    const uploadDir = path.join(__dirname, '../../uploads', uploadId);

    // 创建上传目录
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const destPath = path.join(uploadDir, file.originalname);

    // 移动文件到上传目录
    fs.writeFileSync(destPath, file.buffer);

    let projectInfo = {
      upload_id: uploadId,
      original_name: file.originalname,
      file_size: file.size,
      file_type: ext,
      extracted: false,
      file_tree: null
    };

    // 如果是ZIP文件，自动解压
    if (ext === '.zip') {
      const extractDir = path.join(uploadDir, 'extracted');
      if (!fs.existsSync(extractDir)) {
        fs.mkdirSync(extractDir, { recursive: true });
      }

      try {
        const AdmZip = require('adm-zip');
        const zip = new AdmZip(destPath);
        zip.extractAllTo(extractDir, true);
        projectInfo.extracted = true;
        projectInfo.extracted_path = 'extracted';
        
        // 生成文件树
        projectInfo.file_tree = generateFileTree(extractDir);
      } catch (zipError) {
        console.error('ZIP解压失败:', zipError);
        return res.status(400).json({ 
          success: false, 
          message: 'ZIP文件解压失败，请检查文件格式' 
        });
      }
    } else {
      // 非ZIP文件，直接解析目录
      projectInfo.file_tree = generateFileTree(uploadDir);
    }

    res.json({
      success: true,
      data: projectInfo
    });
  } catch (error) {
    console.error('上传失败:', error);
    res.status(500).json({ success: false, message: '上传失败: ' + error.message });
  }
}

/**
 * 分析项目结构
 */
async function analyzeProject(req, res) {
  try {
    const { upload_id, project_name, description } = req.body;
    
    if (!upload_id) {
      return res.status(400).json({ success: false, message: '缺少上传ID' });
    }

    const uploadDir = path.join(__dirname, '../../uploads', upload_id);
    if (!fs.existsSync(uploadDir)) {
      return res.status(404).json({ success: false, message: '上传文件不存在或已过期' });
    }

    // 查找项目根目录
    let projectRoot = uploadDir;
    const extractedDir = path.join(uploadDir, 'extracted');
    if (fs.existsSync(extractedDir)) {
      projectRoot = extractedDir;
    }

    // 分析项目类型
    const projectType = detectProjectType(projectRoot);
    
    // 获取关键文件内容
    const keyFiles = await getKeyFilesContent(projectRoot, projectType);
    
    // 生成分析报告
    const analysis = {
      project_type: projectType,
      language: detectLanguage(projectRoot),
      frameworks: detectFrameworks(projectRoot, projectType),
      key_files: keyFiles,
      has_readme: fs.existsSync(path.join(projectRoot, 'README.md')),
      has_git: fs.existsSync(path.join(projectRoot, '.git')),
      package_json: fs.existsSync(path.join(projectRoot, 'package.json')),
      requirements: fs.existsSync(path.join(projectRoot, 'requirements.txt')),
      pom: fs.existsSync(path.join(projectRoot, 'pom.xml')),
      build_gradle: fs.existsSync(path.join(projectRoot, 'build.gradle'))
    };

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('分析失败:', error);
    res.status(500).json({ success: false, message: '分析失败: ' + error.message });
  }
}

/**
 * AI查错功能
 */
async function checkErrors(req, res) {
  try {
    const { upload_id, project_type } = req.body;
    
    if (!upload_id) {
      return res.status(400).json({ success: false, message: '缺少上传ID' });
    }

    const uploadDir = path.join(__dirname, '../../uploads', upload_id);
    if (!fs.existsSync(uploadDir)) {
      return res.status(404).json({ success: false, message: '上传文件不存在或已过期' });
    }

    // 查找项目根目录
    let projectRoot = uploadDir;
    const extractedDir = path.join(uploadDir, 'extracted');
    if (fs.existsSync(extractedDir)) {
      projectRoot = extractedDir;
    }

    // 获取项目文件列表
    const fileTree = generateFileTree(projectRoot);
    
    // 读取代码文件内容
    const codeFiles = collectCodeFiles(projectRoot);
    
    // 使用AI分析代码错误
    const aiResult = await analyzeWithAI(codeFiles, project_type || 'unknown');
    
    res.json({
      success: true,
      data: {
        file_count: codeFiles.length,
        errors: aiResult.errors || [],
        warnings: aiResult.warnings || [],
        suggestions: aiResult.suggestions || [],
        summary: aiResult.summary
      }
    });
  } catch (error) {
    console.error('查错失败:', error);
    res.status(500).json({ success: false, message: '查错失败: ' + error.message });
  }
}

/**
 * 修复错误
 */
async function fixErrors(req, res) {
  try {
    const { upload_id, error_ids, project_type } = req.body;
    
    if (!upload_id) {
      return res.status(400).json({ success: false, message: '缺少上传ID' });
    }

    const uploadDir = path.join(__dirname, '../../uploads', upload_id);
    if (!fs.existsSync(uploadDir)) {
      return res.status(404).json({ success: false, message: '上传文件不存在或已过期' });
    }

    // 获取AI修复建议
    const aiResult = await getFixSuggestions(uploadDir, error_ids, project_type);
    
    res.json({
      success: true,
      data: aiResult
    });
  } catch (error) {
    console.error('修复失败:', error);
    res.status(500).json({ success: false, message: '修复失败: ' + error.message });
  }
}

/**
 * 创建项目（从上传的文件）
 */
async function createFromUpload(req, res) {
  try {
    const { upload_id, name, description, config } = req.body;
    
    if (!upload_id) {
      return res.status(400).json({ success: false, message: '缺少上传ID' });
    }

    const uploadDir = path.join(__dirname, '../../uploads', upload_id);
    if (!fs.existsSync(uploadDir)) {
      return res.status(404).json({ success: false, message: '上传文件不存在或已过期' });
    }

    const db = getDB();
    
    // 查找项目根目录
    let projectRoot = uploadDir;
    const extractedDir = path.join(uploadDir, 'extracted');
    if (fs.existsSync(extractedDir)) {
      projectRoot = extractedDir;
    }

    // 分析项目
    const projectType = detectProjectType(projectRoot);
    
    // 创建数据库记录
    const projectConfig = {
      upload_id,
      project_type: projectType,
      original_name: fs.readdirSync(uploadDir)[0],
      ...config
    };

    const [result] = await db.query(
      `INSERT INTO projects (user_id, name, description, config, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
      [req.user.id, name, description, JSON.stringify(projectConfig)]
    );

    res.json({
      success: true,
      data: { 
        id: result.insertId, 
        name, 
        description,
        project_type: projectType
      }
    });
  } catch (error) {
    console.error('创建项目失败:', error);
    res.status(500).json({ success: false, message: '创建项目失败: ' + error.message });
  }
}

/**
 * 删除上传文件
 */
async function deleteUpload(req, res) {
  try {
    const { upload_id } = req.body;
    
    if (!upload_id) {
      return res.status(400).json({ success: false, message: '缺少上传ID' });
    }

    const uploadDir = path.join(__dirname, '../../uploads', upload_id);
    if (fs.existsSync(uploadDir)) {
      fs.rmSync(uploadDir, { recursive: true, force: true });
    }

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除失败:', error);
    res.status(500).json({ success: false, message: '删除失败' });
  }
}

// ============ 辅助函数 ============

/**
 * 生成文件树
 */
function generateFileTree(dir, prefix = '') {
  const items = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  // 限制显示的文件数量
  const maxItems = 200;
  const visibleEntries = entries.slice(0, maxItems);
  const hiddenCount = entries.length - maxItems;

  for (const entry of visibleEntries) {
    // 跳过隐藏文件和node_modules
    if (entry.name.startsWith('.') || entry.name === 'node_modules') {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(prefix, entry.name);
    
    if (entry.isDirectory()) {
      const children = generateFileTree(fullPath, relativePath);
      if (children.length > 0) {
        items.push({
          name: entry.name,
          path: relativePath,
          type: 'directory',
          children: children.slice(0, 50) // 限制子目录显示
        });
      }
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.kt', '.swift', '.go', '.rs', '.c', '.cpp', '.h', '.cs', '.rb', '.php'];
      
      items.push({
        name: entry.name,
        path: relativePath,
        type: 'file',
        extension: ext,
        isCode: codeExtensions.includes(ext),
        size: fs.statSync(fullPath).size
      });
    }
  }

  if (hiddenCount > 0) {
    items.push({ name: '...还有 ' + hiddenCount + ' 个文件', type: 'more' });
  }

  return items;
}

/**
 * 检测项目类型
 */
function detectProjectType(dir) {
  const files = fs.readdirSync(dir);
  
  if (files.includes('pubspec.yaml')) return 'flutter';
  if (files.includes('package.json')) {
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    if (pkg.dependencies && (pkg.dependencies.react || pkg.dependencies['react-native'])) return 'react-native';
    if (pkg.dependencies && pkg.dependencies['@react-native-community/cli']) return 'react-native';
    if (pkg.dependencies && pkg.dependencies.vue) return 'vue';
    if (pkg.dependencies && pkg.dependencies.next) return 'nextjs';
    return 'nodejs';
  }
  if (files.includes('requirements.txt') || files.includes('setup.py')) return 'python';
  if (files.includes('pom.xml')) return 'java';
  if (files.includes('build.gradle')) return 'android';
  if (files.includes('go.mod')) return 'go';
  if (files.includes('Cargo.toml')) return 'rust';
  if (files.includes('main.swift') || files.includes('Package.swift')) return 'ios';
  
  return 'unknown';
}

/**
 * 检测编程语言
 */
function detectLanguage(dir) {
  const files = fs.readdirSync(dir);
  
  if (files.some(f => f.endsWith('.ts') || f.endsWith('.tsx'))) return 'TypeScript';
  if (files.some(f => f.endsWith('.js') || f.endsWith('.jsx'))) return 'JavaScript';
  if (files.some(f => f.endsWith('.py'))) return 'Python';
  if (files.some(f => f.endsWith('.java'))) return 'Java';
  if (files.some(f => f.endsWith('.kt'))) return 'Kotlin';
  if (files.some(f => f.endsWith('.swift'))) return 'Swift';
  if (files.some(f => f.endsWith('.go'))) return 'Go';
  if (files.some(f => f.endsWith('.rs'))) return 'Rust';
  
  return 'Unknown';
}

/**
 * 检测框架
 */
function detectFrameworks(dir, projectType) {
  const frameworks = [];
  
  try {
    if (projectType === 'react-native' || projectType === 'nodejs') {
      const pkgPath = path.join(dir, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
        
        if (deps.expo) frameworks.push('Expo');
        if (deps['react-navigation']) frameworks.push('React Navigation');
        if (deps['@react-native-community/cli']) frameworks.push('React Native CLI');
        if (deps.expoModulesCore) frameworks.push('Expo Modules');
        if (deps.axios) frameworks.push('Axios');
        if (deps.socketio) frameworks.push('Socket.io');
      }
    }
    
    if (projectType === 'flutter') {
      const pubspecPath = path.join(dir, 'pubspec.yaml');
      if (fs.existsSync(pubsspecPath)) {
        const content = fs.readFileSync(pubsspecPath, 'utf8');
        if (content.includes('provider')) frameworks.push('Provider');
        if (content.includes('flutter_bloc')) frameworks.push('BLoC');
        if (content.includes('get:')) frameworks.push('GetX');
        if (content.includes('dio')) frameworks.push('Dio');
        if (content.includes('sqflite')) frameworks.push('SQLite');
      }
    }
  } catch (e) {
    console.error('框架检测失败:', e);
  }
  
  return frameworks;
}

/**
 * 获取关键文件内容
 */
async function getKeyFilesContent(dir, projectType) {
  const keyFiles = {};
  
  try {
    // package.json
    if (projectType === 'react-native' || projectType === 'nodejs') {
      const pkgPath = path.join(dir, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        keyFiles.package_json = {
          name: pkg.name,
          version: pkg.version,
          dependencies: Object.keys(pkg.dependencies || {}),
          devDependencies: Object.keys(pkg.devDependencies || {})
        };
      }
    }
    
    // README
    const readmePath = path.join(dir, 'README.md');
    if (fs.existsSync(readmePath)) {
      keyFiles.readme = fs.readFileSync(readmePath, 'utf8').substring(0, 2000);
    }
  } catch (e) {
    console.error('获取关键文件失败:', e);
  }
  
  return keyFiles;
}

/**
 * 收集代码文件
 */
function collectCodeFiles(dir, maxFiles = 20) {
  const codeFiles = [];
  const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java'];
  const maxSize = 50000; // 50KB
  
  function scan(dir, depth = 0) {
    if (depth > 5 || codeFiles.length >= maxFiles) return;
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (codeFiles.length >= maxFiles) break;
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          scan(fullPath, depth + 1);
        } else {
          const ext = path.extname(entry.name).toLowerCase();
          if (codeExtensions.includes(ext)) {
            const stats = fs.statSync(fullPath);
            if (stats.size <= maxSize) {
              codeFiles.push({
                path: fullPath.replace(dir, ''),
                content: fs.readFileSync(fullPath, 'utf8').substring(0, maxSize)
              });
            }
          }
        }
      }
    } catch (e) {
      // 忽略权限错误
    }
  }
  
  scan(dir);
  return codeFiles;
}

/**
 * 使用AI分析代码错误
 */
async function analyzeWithAI(codeFiles, projectType) {
  try {
    // 获取AI配置
    const { getAIConfig, checkUsageLimit, callAI } = aiController;
    
    const aiConfig = await getAIConfig(null, null);
    
    // 构建分析提示
    const codeSummary = codeFiles.map(f => 
      '// 文件: ' + f.path + '\n' + f.content.substring(0, 3000)
    ).join('\n\n');

    const prompt = '你是一个专业的代码审查专家。请分析以下' + projectType + '项目代码，找出潜在错误、问题并提供修复建议。\n\n项目类型: ' + projectType + '\n文件数量: ' + codeFiles.length + '\n\n代码内容:\n' + codeSummary + '\n\n请以JSON格式返回分析结果:\n{\n  "errors": [\n    {"file": "文件路径", "line": "行号", "type": "error", "message": "错误描述", "suggestion": "修复建议"}\n  ],\n  "warnings": [\n    {"file": "文件路径", "type": "warning", "message": "警告描述", "suggestion": "建议"}\n  ],\n  "suggestions": [\n    {"file": "文件路径", "message": "优化建议", "priority": "high/medium/low"}\n  ],\n  "summary": "整体评估摘要"\n}';

    const response = await callAI(aiConfig, [{ role: 'user', content: prompt }]);
    
    // 解析AI响应
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // 解析失败，返回原始内容
    }
    
    return {
      errors: [],
      warnings: [],
      suggestions: [],
      summary: response.content.substring(0, 500)
    };
  } catch (error) {
    console.error('AI分析失败:', error);
    return {
      errors: [],
      warnings: ['AI分析服务暂时不可用'],
      suggestions: [],
      summary: 'AI分析失败，请稍后重试'
    };
  }
}

/**
 * 获取修复建议
 */
async function getFixSuggestions(uploadDir, errorIds, projectType) {
  try {
    const { getAIConfig, callAI } = aiController;
    const aiConfig = await getAIConfig(null, null);
    
    const prompt = '用户选择了修复以下错误ID: ' + JSON.stringify(errorIds) + '\n项目类型: ' + projectType + '\n\n请提供修复后的代码片段和改进建议。\n返回JSON格式:\n{\n  "fixes": [\n    {"error_id": "错误ID", "file": "文件路径", "original": "原始代码", "fixed": "修复后代码", "explanation": "说明"}\n  ],\n  "instructions": "修复步骤说明"\n}';

    const response = await callAI(aiConfig, [{ role: 'user', content: prompt }]);
    
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {}
    
    return { fixes: [], instructions: response.content };
  } catch (error) {
    console.error('获取修复建议失败:', error);
    return { fixes: [], instructions: '获取修复建议失败' };
  }
}

module.exports = {
  uploadProject,
  analyzeProject,
  checkErrors,
  fixErrors,
  createFromUpload,
  deleteUpload
};
