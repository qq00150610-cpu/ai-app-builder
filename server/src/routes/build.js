const express = require('express');
const router = express.Router();
const buildController = require('../controllers/build');
const authMiddleware = require('../middleware/auth');

// 提交构建任务
router.post('/submit', authMiddleware, buildController.submit);

// 查询构建状态
router.get('/status/:taskId', authMiddleware, buildController.getStatus);

// 获取构建历史
router.get('/history', authMiddleware, buildController.getHistory);

// 下载APK
router.get('/download/:taskId', authMiddleware, buildController.download);

// 取消构建
router.post('/cancel/:taskId', authMiddleware, buildController.cancel);

module.exports = router;
