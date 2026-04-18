const { getDB } = require('../config/database');
const axios = require('axios');
const crypto = require('crypto');

// 会员套餐配置
const PACKAGES = [
  { id: 1, name: '年度会员', price: 9.9, type: 1, duration: 365, description: '无限打包，全部模板，优先编译' },
  { id: 2, name: '永久会员', price: 99, type: 2, duration: null, description: '永久权益，优先客服，新功能抢先体验' }
];

// 获取会员套餐
async function getPackages(req, res) {
  res.json({ success: true, data: PACKAGES });
}

// 创建订单
async function createOrder(req, res) {
  try {
    const { package_id, pay_method } = req.body; // pay_method: wechat | alipay
    
    const pkg = PACKAGES.find(p => p.id === package_id);
    if (!pkg) {
      return res.status(400).json({ success: false, message: '套餐不存在' });
    }
    
    const orderNo = generateOrderNo();
    const db = getDB();
    
    // 创建订单
    await db.query(
      `INSERT INTO orders (order_no, user_id, product_type, amount, pay_method, pay_status, created_at)
       VALUES (?, ?, ?, ?, ?, 0, NOW())`,
      [orderNo, req.user.id, pkg.type, pkg.price, pay_method]
    );
    
    // 获取支付参数
    let payParams;
    if (pay_method === 'wechat') {
      payParams = await createWechatOrder(orderNo, pkg.price);
    } else if (pay_method === 'alipay') {
      payParams = await createAlipayOrder(orderNo, pkg.price, pkg.name);
    }
    
    res.json({
      success: true,
      data: {
        order_no: orderNo,
        amount: pkg.price,
        pay_params: payParams
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 查询订单状态
async function getOrderStatus(req, res) {
  try {
    const { orderNo } = req.params;
    const db = getDB();
    
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE order_no = ? AND user_id = ?',
      [orderNo, req.user.id]
    );
    
    if (!orders[0]) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    res.json({ success: true, data: orders[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 微信支付回调
async function wechatNotify(req, res) {
  try {
    const { out_trade_no, transaction_id } = req.body;
    
    // 验证签名（TODO: 实际验证）
    
    await handlePaymentSuccess(out_trade_no, transaction_id);
    
    res.send('<xml><return_code><![CDATA[SUCCESS]]></return_code></xml>');
  } catch (error) {
    res.send('<xml><return_code><![CDATA[FAIL]]></return_code></xml>');
  }
}

// 支付宝支付回调
async function alipayNotify(req, res) {
  try {
    const { out_trade_no, trade_no } = req.body;
    
    await handlePaymentSuccess(out_trade_no, trade_no);
    
    res.send('success');
  } catch (error) {
    res.send('fail');
  }
}

// 获取订单列表
async function getOrderList(req, res) {
  try {
    const db = getDB();
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 处理支付成功
async function handlePaymentSuccess(orderNo, tradeNo) {
  const db = getDB();
  
  const [orders] = await db.query('SELECT * FROM orders WHERE order_no = ?', [orderNo]);
  const order = orders[0];
  
  if (!order || order.pay_status === 1) return;
  
  // 更新订单状态
  await db.query(
    'UPDATE orders SET pay_status = 1, trade_no = ?, paid_at = NOW() WHERE order_no = ?',
    [tradeNo, orderNo]
  );
  
  // 更新用户会员状态
  const pkg = PACKAGES.find(p => p.type === order.product_type);
  
  if (pkg.type === 2) {
    // 永久会员
    await db.query(
      'UPDATE users SET member_type = 2 WHERE id = ?',
      [order.user_id]
    );
  } else {
    // 年费会员
    const [users] = await db.query('SELECT member_expire_at FROM users WHERE id = ?', [order.user_id]);
    const currentExpire = users[0].member_expire_at;
    const baseDate = currentExpire && new Date(currentExpire) > new Date() ? new Date(currentExpire) : new Date();
    const newExpire = new Date(baseDate.getTime() + pkg.duration * 24 * 60 * 60 * 1000);
    
    await db.query(
      'UPDATE users SET member_type = 1, member_expire_at = ? WHERE id = ?',
      [newExpire, order.user_id]
    );
  }
}

// 生成订单号
function generateOrderNo() {
  const now = new Date();
  return now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0') +
    Math.random().toString(36).substring(2, 8).toUpperCase();
}

// 创建微信订单
async function createWechatOrder(orderNo, amount) {
  // TODO: 实际调用微信支付API
  return {
    appid: process.env.WECHAT_APP_ID,
    partnerid: process.env.WECHAT_MCH_ID,
    prepayid: 'mock_prepay_id',
    noncestr: Math.random().toString(36).substring(2),
    timestamp: Math.floor(Date.now() / 1000).toString(),
    sign: 'mock_sign'
  };
}

// 创建支付宝订单
async function createAlipayOrder(orderNo, amount, subject) {
  // TODO: 实际调用支付宝支付API
  return {
    order_string: `app_id=${process.env.ALIPAY_APP_ID}&biz_content={"out_trade_no":"${orderNo}","total_amount":"${amount}","subject":"${subject}"}`
  };
}

module.exports = {
  getPackages,
  createOrder,
  getOrderStatus,
  wechatNotify,
  alipayNotify,
  getOrderList
};
