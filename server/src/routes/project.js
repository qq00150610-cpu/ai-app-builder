const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project');
const authMiddleware = require('../middleware/auth');

// 获取项目列表
router.get('/list', authMiddleware, projectController.getList);

// 获取项目详情
router.get('/:id', authMiddleware, projectController.getDetail);

// 创建项目
router.post('/create', authMiddleware, projectController.create);

// 更新项目
router.put('/:id', authMiddleware, projectController.update);

// 删除项目
router.delete('/:id', authMiddleware, projectController.delete);

// 复制项目
router.post('/:id/copy', authMiddleware, projectController.copy);

module.exports = router;
