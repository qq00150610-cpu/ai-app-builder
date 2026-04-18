const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth');
const authMiddleware = require('../middleware/auth');

// 发送手机验证码
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

// 邮箱登录
router.post('/email-login',
  body('email').isEmail(),
  body('password').notEmpty(),
  authController.emailLogin
);

// 邮箱注册 - 发送验证码
router.post('/register',
  body('username').isLength({ min: 2, max: 20 }).matches(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  authController.register
);

// 验证注册
router.post('/verify-register',
  body('email').isEmail(),
  body('code').isLength({ min: 6, max: 6 }),
  authController.verifyRegister
);

// 重新发送验证码
router.post('/resend-code',
  body('email').isEmail(),
  authController.resendCode
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
