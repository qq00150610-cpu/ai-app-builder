const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai');
const authMiddleware = require('../middleware/auth');

// AI对话生成
router.post('/chat', authMiddleware, aiController.chat);

// 生成页面结构
router.post('/generate-page', authMiddleware, aiController.generatePage);

// 生成组件
router.post('/generate-component', authMiddleware, aiController.generateComponent);

// 测试AI配置
router.post('/test-config', authMiddleware, aiController.testConfig);

module.exports = router;
