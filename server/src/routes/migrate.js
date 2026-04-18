const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

/**
 * 执行数据库迁移
 * GET /api/migrate/email-fields
 */
router.get('/email-fields', async (req, res) => {
  let connection;
  try {
    // 尝试多种连接方式
    const connectionOptions = [
      { host: '127.0.0.1', port: 3306, user: 'root', password: '', database: 'ai_app_builder' },
      { host: '127.0.0.1', port: 3306, user: 'root', password: 'mm900236..', database: 'ai_app_builder' },
      { host: '127.0.0.1', port: 3306, user: 'root', password: 'AiBuilder@2024!', database: 'ai_app_builder' },
    ];
    
    let connection = null;
    for (const opts of connectionOptions) {
      try {
        connection = await mysql.createConnection(opts);
        await connection.query('SELECT 1');
        console.log('✓ Connected to MySQL');
        break;
      } catch (e) {
        console.log('✗ Connection failed:', e.message.split('\n')[0]);
        connection = null;
      }
    }
    
    if (!connection) {
      return res.status(500).json({ success: false, message: '无法连接到MySQL数据库' });
    }
    
    console.log('开始数据库迁移...');
    
    // 添加username字段
    try {
      await connection.query('ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE COMMENT "用户名" AFTER phone');
      console.log('✓ username字段添加成功');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME' && e.code !== 'ER_BAD_FIELD_ERROR') console.log('- username:', e.message.split('\n')[0]);
    }
    
    // 添加email字段
    try {
      await connection.query('ALTER TABLE users ADD COLUMN email VARCHAR(100) UNIQUE COMMENT "邮箱" AFTER username');
      console.log('✓ email字段添加成功');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME' && e.code !== 'ER_BAD_FIELD_ERROR') console.log('- email:', e.message.split('\n')[0]);
    }
    
    // 添加password字段
    try {
      await connection.query('ALTER TABLE users ADD COLUMN password VARCHAR(255) COMMENT "密码" AFTER email');
      console.log('✓ password字段添加成功');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME' && e.code !== 'ER_BAD_FIELD_ERROR') console.log('- password:', e.message.split('\n')[0]);
    }
    
    // 创建user_ai_configs表
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS user_ai_configs (
          id BIGINT PRIMARY KEY AUTO_INCREMENT,
          user_id BIGINT NOT NULL,
          config_name VARCHAR(50),
          model_type VARCHAR(20),
          api_endpoint VARCHAR(255),
          api_key VARCHAR(255),
          model_name VARCHAR(50),
          temperature DECIMAL(2,1) DEFAULT 0.7,
          max_tokens INT DEFAULT 2048,
          is_default TINYINT DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log('✓ user_ai_configs表创建成功');
    } catch (e) {
      if (e.code !== 'ER_TABLE_EXISTS_ERROR') console.log('- user_ai_configs:', e.message.split('\n')[0]);
    }
    
    // 创建ai_usage_logs表
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS ai_usage_logs (
          id BIGINT PRIMARY KEY AUTO_INCREMENT,
          user_id BIGINT NOT NULL,
          config_id BIGINT,
          type VARCHAR(20) DEFAULT 'ai',
          tokens_used INT DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_date (user_id, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log('✓ ai_usage_logs表创建成功');
    } catch (e) {
      if (e.code !== 'ER_TABLE_EXISTS_ERROR') console.log('- ai_usage_logs:', e.message.split('\n')[0]);
    }
    
    const [columns] = await connection.query('SHOW COLUMNS FROM users');
    await connection.end();
    
    console.log('数据库迁移完成！');
    res.json({
      success: true,
      message: '数据库迁移完成',
      fields: columns.map(c => c.Field)
    });
  } catch (error) {
    console.error('迁移失败:', error.message);
    res.status(500).json({ success: false, message: '迁移失败: ' + error.message.split('\n')[0] });
  }
});

/**
 * 更新.env配置
 * POST /api/migrate/update-env
 */
router.post('/update-env', async (req, res) => {
  try {
    const { DB_PASSWORD } = req.body;
    if (!DB_PASSWORD) {
      return res.status(400).json({ success: false, message: '需要提供 DB_PASSWORD' });
    }
    
    const envPath = path.join(__dirname, '../../.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // 更新DB_PASSWORD
    if (envContent.includes('DB_PASSWORD=')) {
      envContent = envContent.replace(/DB_PASSWORD=.*/, `DB_PASSWORD=${DB_PASSWORD}`);
    } else {
      envContent += `\nDB_PASSWORD=${DB_PASSWORD}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    
    res.json({ success: true, message: '配置已更新，请重启服务' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
