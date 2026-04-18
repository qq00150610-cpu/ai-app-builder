const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB, getRedis } = require('../config/database');
const axios = require('axios');

// 发送验证码（通用）
const sendCode = async (req, res) => {
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
};

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

// 邮箱登录
async function emailLogin(req, res) {
  try {
    const { email, password } = req.body;
    const db = getDB();
    
    // 查找用户
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];
    
    if (!user) {
      return res.status(400).json({ success: false, message: '用户不存在，请先注册' });
    }
    
    if (!user.password) {
      return res.status(400).json({ success: false, message: '该账号未设置密码，请使用手机验证码登录' });
    }
    
    // 验证密码
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ success: false, message: '密码错误' });
    }
    
    // 生成Token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
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

// 邮箱注册 - 发送验证码
async function register(req, res) {
  try {
    const { username, email, password } = req.body;
    const db = getDB();
    const redis = getRedis();
    
    // 检查邮箱是否已注册
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: '该邮箱已被注册' });
    }
    
    // 检查用户名是否已存在
    const [existingNames] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (existingNames.length > 0) {
      return res.status(400).json({ success: false, message: '该用户名已被使用' });
    }
    
    // 生成验证码
    const code = Math.random().toString().slice(-6);
    
    // 存储验证码和注册信息（10分钟有效）
    await redis.setEx(`register:${email}`, 600, JSON.stringify({
      username,
      password: await bcrypt.hash(password, 10),
      code
    }));
    
    // TODO: 发送验证邮件
    // 开发环境直接返回验证码
    res.json({ 
      success: true, 
      message: '验证码已发送到邮箱',
      dev_code: process.env.NODE_ENV === 'development' ? code : undefined
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 验证注册
async function verifyRegister(req, res) {
  try {
    const { email, code } = req.body;
    const db = getDB();
    const redis = getRedis();
    
    // 获取存储的注册信息
    const stored = await redis.get(`register:${email}`);
    if (!stored) {
      return res.status(400).json({ success: false, message: '验证码已过期，请重新获取' });
    }
    
    const { username, password, code: storedCode } = JSON.parse(stored);
    
    // 验证验证码
    if (storedCode !== code) {
      return res.status(400).json({ success: false, message: '验证码错误' });
    }
    
    // 创建用户
    const [result] = await db.query(
      'INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, NOW())',
      [username, email, password]
    );
    
    // 删除验证码
    await redis.del(`register:${email}`);
    
    // 生成Token
    const token = jwt.sign(
      { userId: result.insertId, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    res.json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          id: result.insertId,
          username,
          email,
          member_type: 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 重新发送验证码
async function resendCode(req, res) {
  try {
    const { email } = req.body;
    const redis = getRedis();
    
    // 获取之前的注册信息
    const stored = await redis.get(`register:${email}`);
    if (!stored) {
      return res.status(400).json({ success: false, message: '无待验证的注册信息，请重新注册' });
    }
    
    const data = JSON.parse(stored);
    const code = Math.random().toString().slice(-6);
    data.code = code;
    
    // 更新验证码
    await redis.setEx(`register:${email}`, 600, JSON.stringify(data));
    
    // TODO: 发送验证邮件
    // 开发环境直接返回验证码
    res.json({ 
      success: true, 
      message: '验证码已重新发送',
      dev_code: process.env.NODE_ENV === 'development' ? code : undefined
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

module.exports = { 
  sendCode, 
  login, 
  emailLogin,
  register, 
  verifyRegister,
  resendCode,
  wechatLogin, 
  refreshToken, 
  logout 
};
