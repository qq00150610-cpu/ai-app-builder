const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment');
const authMiddleware = require('../middleware/auth');

// 获取会员套餐
router.get('/packages', paymentController.getPackages);

// 创建订单
router.post('/create-order', authMiddleware, paymentController.createOrder);

// 查询订单状态
router.get('/order/:orderNo', authMiddleware, paymentController.getOrderStatus);

// 微信支付回调
router.post('/wechat/notify', paymentController.wechatNotify);

// 支付宝支付回调
router.post('/alipay/notify', paymentController.alipayNotify);

// 获取订单列表
router.get('/orders', authMiddleware, paymentController.getOrderList);

module.exports = router;
