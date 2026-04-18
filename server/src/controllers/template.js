const { getDB } = require('../config/database');

// 预置模板
const TEMPLATES = [
  {
    id: 1,
    name: '工具类应用',
    category: 'tool',
    description: '适合开发各类小工具',
    preview: '',
    config: {
      pages: [
        { name: '首页', components: [{ type: 'list', props: { title: '功能列表' } }] }
      ]
    }
  },
  {
    id: 2,
    name: 'WebView应用',
    category: 'webview',
    description: '快速封装网页为APP',
    preview: '',
    config: {
      pages: [
        { name: '主页', components: [{ type: 'webview', props: { url: 'https://example.com' } }] }
      ]
    }
  },
  {
    id: 3,
    name: '展示类应用',
    category: 'display',
    description: '适合产品展示、个人介绍',
    preview: '',
    config: {
      pages: [
        { name: '首页', components: [{ type: 'swiper', props: { autoPlay: true } }] },
        { name: '详情', components: [{ type: 'text' }, { type: 'image' }] }
      ]
    }
  },
  {
    id: 4,
    name: '简易交互应用',
    category: 'interactive',
    description: '支持表单、按钮等交互',
    preview: '',
    config: {
      pages: [
        { name: '首页', components: [{ type: 'form', props: {} }] }
      ]
    }
  }
];

// 获取模板列表
async function getList(req, res) {
  try {
    const { category } = req.query;
    let templates = TEMPLATES;
    
    if (category) {
      templates = templates.filter(t => t.category === category);
    }
    
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 获取模板详情
async function getDetail(req, res) {
  try {
    const { id } = req.params;
    const template = TEMPLATES.find(t => t.id === parseInt(id));
    
    if (!template) {
      return res.status(404).json({ success: false, message: '模板不存在' });
    }
    
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 使用模板创建项目
async function useTemplate(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    const template = TEMPLATES.find(t => t.id === parseInt(id));
    if (!template) {
      return res.status(404).json({ success: false, message: '模板不存在' });
    }
    
    const db = getDB();
    const [result] = await db.query(
      `INSERT INTO projects (user_id, name, description, config, status, created_at)
       VALUES (?, ?, ?, ?, 1, NOW())`,
      [req.user.id, name || template.name, template.description, JSON.stringify(template.config)]
    );
    
    res.json({
      success: true,
      data: { id: result.insertId, name: name || template.name }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { getList, getDetail, useTemplate };
