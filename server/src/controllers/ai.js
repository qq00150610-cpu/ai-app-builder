const axios = require('axios');
const { getDB, getRedis } = require('../config/database');

// AI对话
async function chat(req, res) {
  try {
    const { messages, config_id } = req.body;
    
    const aiConfig = await getAIConfig(req.user.id, config_id);
    const canUse = await checkUsageLimit(req.user.id, 'ai', aiConfig.is_default);
    
    if (!canUse) {
      return res.status(403).json({ success: false, message: '今日AI使用次数已达上限，请升级会员' });
    }
    
    const response = await callAI(aiConfig, messages);
    
    // 记录使用
    await logUsage(req.user.id, 'ai');
    
    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 生成页面结构
async function generatePage(req, res) {
  try {
    const { description, config_id } = req.body;
    
    const aiConfig = await getAIConfig(req.user.id, config_id);
    const canUse = await checkUsageLimit(req.user.id, 'ai', aiConfig.is_default);
    
    if (!canUse) {
      return res.status(403).json({ success: false, message: '今日AI使用次数已达上限' });
    }
    
    const prompt = `你是一个移动应用页面设计师。根据用户描述生成页面JSON配置。

用户描述：${description}

请返回以下格式的JSON（不要包含其他内容）：
{
  "pageName": "页面名称",
  "components": [
    {
      "type": "text|image|button|input|list|container",
      "props": { 组件属性 },
      "style": { 样式配置 },
      "children": []
    }
  ]
}`;

    const response = await callAI(aiConfig, [{ role: 'user', content: prompt }]);
    
    await logUsage(req.user.id, 'ai');
    
    // 解析JSON
    let pageConfig;
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      pageConfig = JSON.parse(jsonMatch[0]);
    } catch (e) {
      pageConfig = { error: '解析失败', raw: response.content };
    }
    
    res.json({ success: true, data: pageConfig });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 生成组件
async function generateComponent(req, res) {
  try {
    const { type, description, config_id } = req.body;
    
    const aiConfig = await getAIConfig(req.user.id, config_id);
    
    const prompt = `生成一个${type}类型的组件配置。
描述：${description}

返回JSON格式：
{
  "type": "${type}",
  "props": {},
  "style": {},
  "content": ""
}`;

    const response = await callAI(aiConfig, [{ role: 'user', content: prompt }]);
    
    await logUsage(req.user.id, 'ai');
    
    res.json({ success: true, data: response.content });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 测试AI配置
async function testConfig(req, res) {
  try {
    const { model_type, api_endpoint, api_key, model_name } = req.body;
    
    const response = await callAI({
      model_type,
      api_endpoint: api_endpoint || getDefaultEndpoint(model_type),
      api_key,
      model_name: model_name || getDefaultModel(model_type)
    }, [{ role: 'user', content: '你好，请回复"测试成功"' }]);
    
    res.json({ 
      success: true, 
      data: { 
        message: '配置有效',
        response: response.content.substring(0, 100)
      } 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: '配置无效: ' + error.message });
  }
}

// 获取AI配置
async function getAIConfig(userId, configId) {
  const db = getDB();
  
  if (configId) {
    const [configs] = await db.query('SELECT * FROM user_ai_configs WHERE id = ? AND user_id = ?', [configId, userId]);
    if (configs[0]) return { ...configs[0], is_default: false };
  }
  
  // 使用平台默认配置
  return {
    model_type: process.env.DEFAULT_AI_PROVIDER,
    api_endpoint: process.env.DEFAULT_AI_BASE_URL,
    api_key: process.env.DEFAULT_AI_API_KEY,
    model_name: process.env.DEFAULT_AI_MODEL,
    is_default: true
  };
}

// 检查使用限制
async function checkUsageLimit(userId, type, isPlatformDefault) {
  // 用户自带API Key不限制
  if (!isPlatformDefault) return true;
  
  const db = getDB();
  const [users] = await db.query('SELECT member_type, member_expire_at FROM users WHERE id = ?', [userId]);
  const user = users[0];
  
  // 会员不限
  if (user.member_type === 2) return true;
  if (user.member_type === 1 && new Date(user.member_expire_at) > new Date()) return true;
  
  // 免费用户检查每日限制
  const [[{ count }]] = await db.query(
    `SELECT COUNT(*) as count FROM ai_usage_logs WHERE user_id = ? AND DATE(created_at) = CURDATE()`,
    [userId]
  );
  
  return count < 10;
}

// 记录使用
async function logUsage(userId, type) {
  const db = getDB();
  await db.query('INSERT INTO ai_usage_logs (user_id, created_at) VALUES (?, NOW())', [userId]);
}

// 调用AI
async function callAI(config, messages) {
  let endpoint = config.api_endpoint;
  let headers = { 'Content-Type': 'application/json' };
  let body;
  
  // 根据模型类型适配
  switch (config.model_type) {
    case 'openai':
    case 'deepseek':
    case 'qwen':
      headers['Authorization'] = `Bearer ${config.api_key}`;
      body = {
        model: config.model_name,
        messages,
        temperature: config.temperature || 0.7,
        max_tokens: config.max_tokens || 2048
      };
      break;
    case 'claude':
      headers['x-api-key'] = config.api_key;
      headers['anthropic-version'] = '2023-06-01';
      body = {
        model: config.model_name,
        messages,
        max_tokens: config.max_tokens || 2048
      };
      break;
    case 'ollama':
      body = {
        model: config.model_name,
        messages,
        stream: false
      };
      break;
    default:
      headers['Authorization'] = `Bearer ${config.api_key}`;
      body = { model: config.model_name, messages };
  }
  
  const response = await axios.post(`${endpoint}/chat/completions`, body, { headers, timeout: 60000 });
  
  return {
    content: response.data.choices?.[0]?.message?.content || response.data.message?.content || '',
    raw: response.data
  };
}

function getDefaultEndpoint(type) {
  const endpoints = {
    openai: 'https://api.openai.com/v1',
    claude: 'https://api.anthropic.com/v1',
    deepseek: 'https://api.deepseek.com/v1',
    qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    ollama: 'http://localhost:11434/api'
  };
  return endpoints[type] || endpoints.openai;
}

function getDefaultModel(type) {
  const models = {
    openai: 'gpt-4o-mini',
    claude: 'claude-3-haiku-20240307',
    deepseek: 'deepseek-chat',
    qwen: 'qwen-turbo',
    ollama: 'llama2'
  };
  return models[type] || 'gpt-4o-mini';
}

module.exports = { chat, generatePage, generateComponent, testConfig };
