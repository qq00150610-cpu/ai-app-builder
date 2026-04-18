const { getDB } = require('../config/database');

// 获取用户信息
async function getInfo(req, res) {
  try {
    const db = getDB();
    const [users] = await db.query(
      'SELECT id, phone, nickname, avatar, member_type, member_expire_at, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (!users[0]) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    res.json({ success: true, data: users[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 更新用户信息
async function updateInfo(req, res) {
  try {
    const { nickname, avatar } = req.body;
    const db = getDB();
    
    await db.query(
      'UPDATE users SET nickname = ?, avatar = ? WHERE id = ?',
      [nickname, avatar, req.user.id]
    );
    
    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 获取会员状态
async function getMembership(req, res) {
  try {
    const db = getDB();
    const [users] = await db.query(
      'SELECT member_type, member_expire_at FROM users WHERE id = ?',
      [req.user.id]
    );
    
    const user = users[0];
    let isActive = false;
    
    if (user.member_type === 2) {
      isActive = true; // 永久会员
    } else if (user.member_type === 1 && user.member_expire_at) {
      isActive = new Date(user.member_expire_at) > new Date();
    }
    
    res.json({
      success: true,
      data: {
        member_type: user.member_type,
        member_expire_at: user.member_expire_at,
        is_active: isActive
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 获取AI配置列表
async function getAIConfigs(req, res) {
  try {
    const db = getDB();
    const [configs] = await db.query(
      'SELECT * FROM user_ai_configs WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );
    
    // 隐藏敏感信息
    const safeConfigs = configs.map(c => ({
      ...c,
      api_key: c.api_key ? '******' + c.api_key.slice(-4) : null
    }));
    
    res.json({ success: true, data: safeConfigs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 添加AI配置
async function addAIConfig(req, res) {
  try {
    const { config_name, model_type, api_endpoint, api_key, model_name, temperature, max_tokens } = req.body;
    const db = getDB();
    
    const [result] = await db.query(
      `INSERT INTO user_ai_configs 
       (user_id, config_name, model_type, api_endpoint, api_key, model_name, temperature, max_tokens, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [req.user.id, config_name, model_type, api_endpoint, api_key, model_name, temperature || 0.7, max_tokens || 2048]
    );
    
    res.json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 更新AI配置
async function updateAIConfig(req, res) {
  try {
    const { id } = req.params;
    const { config_name, model_type, api_endpoint, api_key, model_name, temperature, max_tokens, is_default } = req.body;
    const db = getDB();
    
    // 验证所有权
    const [configs] = await db.query('SELECT id FROM user_ai_configs WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!configs[0]) {
      return res.status(404).json({ success: false, message: '配置不存在' });
    }
    
    await db.query(
      `UPDATE user_ai_configs 
       SET config_name = ?, model_type = ?, api_endpoint = ?, api_key = ?, model_name = ?, temperature = ?, max_tokens = ?, is_default = ?
       WHERE id = ?`,
      [config_name, model_type, api_endpoint, api_key, model_name, temperature, max_tokens, is_default ? 1 : 0, id]
    );
    
    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 删除AI配置
async function deleteAIConfig(req, res) {
  try {
    const { id } = req.params;
    const db = getDB();
    
    await db.query('DELETE FROM user_ai_configs WHERE id = ? AND user_id = ?', [id, req.user.id]);
    
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 获取使用记录
async function getUsage(req, res) {
  try {
    const db = getDB();
    
    // 获取今日打包次数
    const [[todayBuild]] = await db.query(
      `SELECT COUNT(*) as count FROM build_tasks 
       WHERE user_id = ? AND DATE(created_at) = CURDATE()`,
      [req.user.id]
    );
    
    // 获取今日AI调用次数
    const [[todayAI]] = await db.query(
      `SELECT COUNT(*) as count FROM ai_usage_logs 
       WHERE user_id = ? AND DATE(created_at) = CURDATE()`,
      [req.user.id]
    );
    
    res.json({
      success: true,
      data: {
        today_build: todayBuild.count,
        today_ai: todayAI.count,
        build_limit: 1, // 免费用户每日限制
        ai_limit: 10    // 免费用户每日限制
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getInfo,
  updateInfo,
  getMembership,
  getAIConfigs,
  addAIConfig,
  updateAIConfig,
  deleteAIConfig,
  getUsage
};
