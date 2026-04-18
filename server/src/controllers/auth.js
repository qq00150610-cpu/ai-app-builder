const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB, getRedis } = require('../config/database');
const axios = require('axios');

// 发送验证码
async function sendCode(req, res) {
  try {
    const { phone } = req.body;
    const code = Math.random().toString().slice(-6);
    
    // 存储验证码（5分钟有效）
    const redis = getRedis();
    await redis.setEx(`sms:${phone}`, 300, code);
    
    // TODO: 调用短信服务发送验证码
    // 开发环境直接返回验证码
    res.json({ 
      success: true, 
      message: '验证码已发送',
      dev_code: process.env.NODE_ENV === 'development' ? code : undefined
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 手机号登录/注册
async function login(req, res) {
  try {
    const { phone, code } = req.body;
    const redis = getRedis();
    
    // 验证码校验
    const savedCode = await redis.get(`sms:${phone}`);
    if (!savedCode || savedCode !== code) {
      return res.status(400).json({ success: false, message: '验证码错误' });
    }
    
    const db = getDB();
    
    // 查找或创建用户
    let [users] = await db.query('SELECT * FROM users WHERE phone = ?', [phone]);
    let user = users[0];
    
    if (!user) {
      const [result] = await db.query(
        'INSERT INTO users (phone, created_at) VALUES (?, NOW())',
        [phone]
      );
      user = { id: result.insertId, phone, member_type: 0 };
    }
    
    // 生成Token
    const token = jwt.sign(
      { userId: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    // 删除验证码
    await redis.del(`sms:${phone}`);
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          member_type: user.member_type,
          member_expire_at: user.member_expire_at
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 微信登录
async function wechatLogin(req, res) {
  try {
    const { code } = req.body;
    
    // 获取微信openid
    const wxRes = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: process.env.WECHAT_APP_ID,
        secret: process.env.WECHAT_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });
    
    const { openid } = wxRes.data;
    if (!openid) {
      return res.status(400).json({ success: false, message: '微信登录失败' });
    }
    
    const db = getDB();
    
    // 查找或创建用户
    let [users] = await db.query('SELECT * FROM users WHERE wechat_openid = ?', [openid]);
    let user = users[0];
    
    if (!user) {
      const [result] = await db.query(
        'INSERT INTO users (wechat_openid, created_at) VALUES (?, NOW())',
        [openid]
      );
      user = { id: result.insertId, wechat_openid: openid, member_type: 0 };
    }
    
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          member_type: user.member_type
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 刷新Token
async function refreshToken(req, res) {
  try {
    const token = jwt.sign(
      { userId: req.user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.json({ success: true, data: { token } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 退出登录
async function logout(req, res) {
  res.json({ success: true, message: '已退出登录' });
}

module.exports = { sendCode, login, wechatLogin, refreshToken, logout };
