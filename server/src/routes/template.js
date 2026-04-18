const express = require('express');
const router = express.Router();
const templateController = require('../controllers/template');
const authMiddleware = require('../middleware/auth');

// 获取模板列表
router.get('/list', templateController.getList);

// 获取模板详情
router.get('/:id', templateController.getDetail);

// 使用模板创建项目
router.post('/:id/use', authMiddleware, templateController.useTemplate);

module.exports = router;
