const axios = require('axios');
const { getDB, getRedis } = require('../config/database');

// AI对话
async function chat(req, res) {
  try {
    const { messages, config_id } = req.body;
    
    const aiConfig = await getAIConfig(req.user.id, config_id);
    const canUse = await checkUsageLimit(req.user.id, 'ai', aiConfig.is_default);
    
    if (!canUse) {
      return res.status(403).json({ success: false, message: '今日AI使用次数已达上限，请升级会员或使用自己的API Key' });
    }
    
    const response = await callAI(aiConfig, messages);
    
    // 仅记录平台默认配置的使用
    if (aiConfig.is_default) {
      await logUsage(req.user.id, 'ai');
    }
    
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
    
    if (aiConfig.is_default) {
      await logUsage(req.user.id, 'ai');
    }
    
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
    const canUse = await checkUsageLimit(req.user.id, 'ai', aiConfig.is_default);
    
    if (!canUse) {
      return res.status(403).json({ success: false, message: '今日AI使用次数已达上限' });
    }
    
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
    
    if (aiConfig.is_default) {
      await logUsage(req.user.id, 'ai');
    }
    
    res.json({ success: true, data: response.content });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 测试AI配置
async function testConfig(req, res) {
  try {
    const { model_type, api_endpoint, api_key, model_name } = req.body;
    
    if (!api_key) {
      return res.status(400).json({ success: false, message: '请提供 API Key' });
    }
    
    const endpoint = api_endpoint || getDefaultEndpoint(model_type);
    const model = model_name || getDefaultModel(model_type);
    
    let messages = [{ role: 'user', content: '请回复"测试成功"' }];
    let result;
    
    try {
      if (model_type === 'claude') {
        // Claude API
        result = await axios.post(
          `${endpoint}/messages`,
          {
            model: model,
            max_tokens: 100,
            messages: messages
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': api_key,
              'anthropic-version': '2023-06-01'
            },
            timeout: 30000
          }
        );
        return res.json({
          success: true,
          data: {
            message: '配置有效',
            response: result.data.content?.[0]?.text || '测试成功'
          }
        });
      } else if (model_type === 'ollama') {
        // Ollama API
        result = await axios.post(
          `${endpoint}/chat`,
          {
            model: model,
            messages: messages
          },
          {
            timeout: 30000
          }
        );
        return res.json({
          success: true,
          data: {
            message: '配置有效',
            response: result.data.message?.content || '测试成功'
          }
        });
      } else {
        // OpenAI 兼容格式
        result = await axios.post(
          `${endpoint}/chat/completions`,
          {
            model: model,
            messages: messages,
            max_tokens: 100
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${api_key}`
            },
            timeout: 30000
          }
        );
        return res.json({
          success: true,
          data: {
            message: '配置有效',
            response: result.data.choices?.[0]?.message?.content || '测试成功'
          }
        });
      }
    } catch (apiError) {
      const errorMsg = apiError.response?.data?.error?.message || apiError.message;
      return res.status(400).json({ success: false, message: 'API调用失败: ' + errorMsg });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: '配置无效: ' + error.message });
  }
}

// 获取AI配置（用户配置优先）
async function getAIConfig(userId, configId) {
  const db = getDB();
  
  // 如果指定了配置ID，优先使用
  if (configId) {
    const [configs] = await db.query(
      'SELECT * FROM user_ai_configs WHERE id = ? AND user_id = ?',
      [configId, userId]
    );
    if (configs[0]) {
      return { ...configs[0], is_default: false };
    }
  }
  
  // 查找用户设为默认的配置
  const [defaultConfigs] = await db.query(
    'SELECT * FROM user_ai_configs WHERE user_id = ? AND is_default = 1',
    [userId]
  );
  if (defaultConfigs[0]) {
    return { ...defaultConfigs[0], is_default: false };
  }
  
  // 使用平台默认配置
  return {
    model_type: process.env.DEFAULT_AI_PROVIDER || 'openai',
    api_endpoint: process.env.DEFAULT_AI_BASE_URL,
    api_key: process.env.DEFAULT_AI_API_KEY,
    model_name: process.env.DEFAULT_AI_MODEL,
    is_default: true
  };
}

// 检查使用限制
async function checkUsageLimit(userId, type, isUserConfig) {
  // 用户使用自己的API Key不受限制
  if (isUserConfig === false) return true;
  
  // 平台默认有限制
  const db = getDB();
  
  // 检查用户是否是会员
  const [users] = await db.query(
    'SELECT member_type, member_expire_at FROM users WHERE id = ?',
    [userId]
  );
  
  if (users[0]) {
    const user = users[0];
    // 永久会员或年费会员且未过期
    if (user.member_type === 2 || 
        (user.member_type === 1 && user.member_expire_at && new Date(user.member_expire_at) > new Date())) {
      return true; // 会员无限制
    }
  }
  
  // 检查今日使用次数
  const [[todayUsage]] = await db.query(
    `SELECT COUNT(*) as count FROM ai_usage_logs 
     WHERE user_id = ? AND DATE(created_at) = CURDATE()`,
    [userId]
  );
  
  return todayUsage.count < 10; // 免费用户每日10次
}

// 记录使用
async function logUsage(userId, type) {
  const db = getDB();
  await db.query(
    'INSERT INTO ai_usage_logs (user_id, type, created_at) VALUES (?, ?, NOW())',
    [userId, type]
  );
}

// 调用AI
async function callAI(config, messages) {
  const { model_type, api_endpoint, api_key, model_name } = config;
  const endpoint = api_endpoint || getDefaultEndpoint(model_type);
  const model = model_name || getDefaultModel(model_type);
  
  try {
    if (model_type === 'claude') {
      // Claude API
      const result = await axios.post(
        `${endpoint}/messages`,
        {
          model: model,
          max_tokens: 4096,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': api_key,
            'anthropic-version': '2023-06-01'
          },
          timeout: 60000
        }
      );
      
      return {
        content: result.data.content?.[0]?.text || '',
        usage: result.data.usage
      };
    } else if (model_type === 'ollama') {
      // Ollama API
      const result = await axios.post(
        `${endpoint}/chat`,
        {
          model: model,
          messages: messages
        },
        {
          timeout: 60000
        }
      );
      
      return {
        content: result.data.message?.content || '',
        usage: null
      };
    } else {
      // OpenAI 兼容格式 (OpenAI, DeepSeek, Qwen等)
      const result = await axios.post(
        `${endpoint}/chat/completions`,
        {
          model: model,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          max_tokens: 4096
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${api_key}`
          },
          timeout: 60000
        }
      );
      
      return {
        content: result.data.choices?.[0]?.message?.content || '',
        usage: result.data.usage
      };
    }
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    throw new Error(`AI调用失败: ${errorMsg}`);
  }
}

// 获取默认端点
function getDefaultEndpoint(model_type) {
  const endpoints = {
    openai: 'https://api.openai.com/v1',
    claude: 'https://api.anthropic.com/v1',
    deepseek: 'https://api.deepseek.com/v1',
    qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    ollama: 'http://localhost:11434/api'
  };
  return endpoints[model_type] || endpoints.openai;
}

// 获取默认模型
function getDefaultModel(model_type) {
  const models = {
    openai: 'gpt-4o-mini',
    claude: 'claude-3-haiku-20240307',
    deepseek: 'deepseek-chat',
    qwen: 'qwen-turbo',
    ollama: 'llama2'
  };
  return models[model_type] || models.openai;
}

module.exports = {
  chat,
  generatePage,
  generateComponent,
  testConfig,
  getAIConfig,
  callAI
};
