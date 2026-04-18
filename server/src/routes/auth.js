const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth');
const authMiddleware = require('../middleware/auth');

// 发送验证码
router.post('/send-code', 
  body('phone').isMobilePhone('zh-CN'),
  authController.sendCode
);

// 手机号登录/注册
router.post('/login',
  body('phone').isMobilePhone('zh-CN'),
  body('code').isLength({ min: 6, max: 6 }),
  authController.login
);

// 微信登录
router.post('/wechat-login',
  body('code').notEmpty(),
  authController.wechatLogin
);

// 刷新Token
router.post('/refresh', authMiddleware, authController.refreshToken);

// 退出登录
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
