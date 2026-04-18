/**
 * 数据库迁移脚本：添加邮箱注册相关字段和AI配置表
 * 运行方式: node src/migrations/add_email_fields.js
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ai_app_builder'
  });

  try {
    console.log('开始数据库迁移...\n');

    // 1. 检查并添加users表的username字段
    console.log('【1】检查 users 表...');
    const [cols1] = await connection.query('SHOW COLUMNS FROM users LIKE "username"');
    if (cols1.length === 0) {
      await connection.query('ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE COMMENT "用户名" AFTER phone');
      console.log('  ✓ 添加 username 字段成功');
    } else {
      console.log('  - username 字段已存在');
    }

    // 检查并添加email字段
    const [cols2] = await connection.query('SHOW COLUMNS FROM users LIKE "email"');
    if (cols2.length === 0) {
      await connection.query('ALTER TABLE users ADD COLUMN email VARCHAR(100) UNIQUE COMMENT "邮箱" AFTER username');
      console.log('  ✓ 添加 email 字段成功');
    } else {
      console.log('  - email 字段已存在');
    }

    // 检查并添加password字段
    const [cols3] = await connection.query('SHOW COLUMNS FROM users LIKE "password"');
    if (cols3.length === 0) {
      await connection.query('ALTER TABLE users ADD COLUMN password VARCHAR(255) COMMENT "密码(bcrypt加密)" AFTER email');
      console.log('  ✓ 添加 password 字段成功');
    } else {
      console.log('  - password 字段已存在');
    }

    // 2. 检查user_ai_configs表
    console.log('\n【2】检查 user_ai_configs 表...');
    const [tables] = await connection.query("SHOW TABLES LIKE 'user_ai_configs'");
    
    if (tables.length === 0) {
      // 创建表
      await connection.query(`
        CREATE TABLE user_ai_configs (
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
      console.log('  ✓ 创建 user_ai_configs 表成功');
    } else {
      console.log('  - user_ai_configs 表已存在');
    }

    // 3. 检查ai_usage_logs表
    console.log('\n【3】检查 ai_usage_logs 表...');
    const [logsTables] = await connection.query("SHOW TABLES LIKE 'ai_usage_logs'");
    
    if (logsTables.length === 0) {
      await connection.query(`
        CREATE TABLE ai_usage_logs (
          id BIGINT PRIMARY KEY AUTO_INCREMENT,
          user_id BIGINT NOT NULL,
          config_id BIGINT COMMENT '使用的配置ID',
          type VARCHAR(20) DEFAULT 'ai' COMMENT '使用类型',
          tokens_used INT DEFAULT 0 COMMENT '使用的Token数',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_date (user_id, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI使用日志表'
      `);
      console.log('  ✓ 创建 ai_usage_logs 表成功');
    } else {
      console.log('  - ai_usage_logs 表已存在');
    }

    // 显示最终表结构
    console.log('\n【4】验证表结构...');
    const [users] = await connection.query('SHOW COLUMNS FROM users');
    console.log('  users 表字段:', users.map(c => c.Field).join(', '));
    
    const [configs] = await connection.query('SHOW COLUMNS FROM user_ai_configs');
    console.log('  user_ai_configs 表字段:', configs.map(c => c.Field).join(', '));

    console.log('\n✅ 数据库迁移完成！');
  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

migrate().catch(console.error);
