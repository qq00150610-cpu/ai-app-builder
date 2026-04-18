const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

/**
 * 执行数据库迁移
 * GET /api/migrate/email-fields
 */
router.get('/email-fields', async (req, res) => {
  let connection;
  try {
    // 尝试多种连接方式
    const connectionOptions = [
      // TCP连接
      {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: '',
        database: 'ai_app_builder'
      },
      {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: 'mm900236..',
        database: 'ai_app_builder'
      }
    ];
    
    let connected = false;
    for (const opts of connectionOptions) {
      try {
        connection = await mysql.createConnection(opts);
        await connection.query('SELECT 1');
        console.log('Connected to MySQL with options:', { host: opts.host, user: opts.user, password: opts.password ? '***' : '' });
        connected = true;
        break;
      } catch (e) {
        console.log('Connection attempt failed:', e.message);
      }
    }
    
    if (!connected) {
      return res.status(500).json({ success: false, message: '无法连接到MySQL数据库' });
    }
    
    console.log('开始数据库迁移...');
    
    // 检查并添加username字段
    try {
      await connection.query('ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE COMMENT "用户名" AFTER phone');
      console.log('✓ 添加 username 字段成功');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.code === 'ER_BAD_FIELD_ERROR') {
        console.log('- username 字段已存在');
      } else {
        throw e;
      }
    }
    
    // 检查并添加email字段
    try {
      await connection.query('ALTER TABLE users ADD COLUMN email VARCHAR(100) UNIQUE COMMENT "邮箱" AFTER username');
      console.log('✓ 添加 email 字段成功');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.code === 'ER_BAD_FIELD_ERROR') {
        console.log('- email 字段已存在');
      } else {
        throw e;
      }
    }
    
    // 检查并添加password字段
    try {
      await connection.query('ALTER TABLE users ADD COLUMN password VARCHAR(255) COMMENT "密码" AFTER email');
      console.log('✓ 添加 password 字段成功');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.code === 'ER_BAD_FIELD_ERROR') {
        console.log('- password 字段已存在');
      } else {
        throw e;
      }
    }
    
    // 创建user_ai_configs表
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS user_ai_configs (
          id BIGINT PRIMARY KEY AUTO_INCREMENT,
          user_id BIGINT NOT NULL,
          config_name VARCHAR(50) COMMENT '配置名称',
          model_type VARCHAR(20) COMMENT 'openai/claude/deepseek/qwen/ollama',
          api_endpoint VARCHAR(255) COMMENT 'API端点地址',
          api_key VARCHAR(255) COMMENT 'API密钥',
          model_name VARCHAR(50) COMMENT '模型名称',
          temperature DECIMAL(2,1) DEFAULT 0.7 COMMENT '温度参数',
          max_tokens INT DEFAULT 2048 COMMENT '最大Token数',
          is_default TINYINT DEFAULT 0 COMMENT '是否为默认配置',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_user (user_id),
          INDEX idx_default (user_id, is_default)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户AI配置表'
      `);
      console.log('✓ 创建 user_ai_configs 表成功');
    } catch (e) {
      if (e.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('- user_ai_configs 表已存在');
      } else {
        throw e;
      }
    }
    
    // 创建ai_usage_logs表
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS ai_usage_logs (
          id BIGINT PRIMARY KEY AUTO_INCREMENT,
          user_id BIGINT NOT NULL,
          config_id BIGINT COMMENT '使用的配置ID',
          type VARCHAR(20) DEFAULT 'ai' COMMENT '使用类型',
          tokens_used INT DEFAULT 0 COMMENT '使用的Token数',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_date (user_id, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI使用日志表'
      `);
      console.log('✓ 创建 ai_usage_logs 表成功');
    } catch (e) {
      if (e.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('- ai_usage_logs 表已存在');
      } else {
        throw e;
      }
    }
    
    // 验证字段
    const [columns] = await connection.query('SHOW COLUMNS FROM users');
    const fieldNames = columns.map(c => c.Field);
    
    console.log('数据库迁移完成！');
    res.json({
      success: true,
      message: '数据库迁移完成',
      fields: fieldNames
    });
  } catch (error) {
    console.error('迁移失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '迁移失败: ' + error.message 
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

module.exports = router;
