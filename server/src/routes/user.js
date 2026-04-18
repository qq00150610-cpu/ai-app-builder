const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const authMiddleware = require('../middleware/auth');

// 获取用户信息
router.get('/info', authMiddleware, userController.getInfo);

// 更新用户信息
router.put('/info', authMiddleware, userController.updateInfo);

// 获取会员状态
router.get('/membership', authMiddleware, userController.getMembership);

// 获取用户AI配置列表
router.get('/ai-configs', authMiddleware, userController.getAIConfigs);

// 添加AI配置
router.post('/ai-configs', authMiddleware, userController.addAIConfig);

// 更新AI配置
router.put('/ai-configs/:id', authMiddleware, userController.updateAIConfig);

// 删除AI配置
router.delete('/ai-configs/:id', authMiddleware, userController.deleteAIConfig);

// 获取使用记录
router.get('/usage', authMiddleware, userController.getUsage);

module.exports = router;
