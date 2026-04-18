/**
 * 数据库迁移脚本：添加邮箱注册相关字段
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
    console.log('开始数据库迁移...');

    // 检查并添加username字段
    const [cols1] = await connection.query('SHOW COLUMNS FROM users LIKE "username"');
    if (cols1.length === 0) {
      await connection.query('ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE COMMENT "用户名" AFTER phone');
      console.log('✓ 添加 username 字段成功');
    } else {
      console.log('- username 字段已存在');
    }

    // 检查并添加email字段
    const [cols2] = await connection.query('SHOW COLUMNS FROM users LIKE "email"');
    if (cols2.length === 0) {
      await connection.query('ALTER TABLE users ADD COLUMN email VARCHAR(100) UNIQUE COMMENT "邮箱" AFTER username');
      console.log('✓ 添加 email 字段成功');
    } else {
      console.log('- email 字段已存在');
    }

    // 检查并添加password字段
    const [cols3] = await connection.query('SHOW COLUMNS FROM users LIKE "password"');
    if (cols3.length === 0) {
      await connection.query('ALTER TABLE users ADD COLUMN password VARCHAR(255) COMMENT "密码" AFTER email');
      console.log('✓ 添加 password 字段成功');
    } else {
      console.log('- password 字段已存在');
    }

    console.log('数据库迁移完成！');
  } catch (error) {
    console.error('迁移失败:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

migrate().catch(console.error);
