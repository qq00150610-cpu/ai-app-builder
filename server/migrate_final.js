/**
 * 数据库最终迁移脚本
 * 执行: cd /opt/ai-app-builder/server && node migrate_final.js
 */
const mysql = require('mysql2/promise');

async function migrate() {
  console.log('开始数据库迁移...\n');
  
  // 尝试多种连接方式
  const options = [
    { host: '127.0.0.1', port: 3306, user: 'root', password: '', database: 'ai_app_builder' },
    { host: '127.0.0.1', port: 3306, user: 'root', password: 'mm900236..', database: 'ai_app_builder' },
  ];
  
  let conn = null;
  for (const opt of options) {
    try {
      conn = await mysql.createConnection(opt);
      await conn.query('SELECT 1');
      console.log('✓ MySQL连接成功 (password:', opt.password ? '***' : '空', ')');
      break;
    } catch(e) {
      console.log('✗ 连接失败:', e.message.split('\n')[0]);
      conn = null;
    }
  }
  
  if (!conn) {
    console.log('\n❌ 无法连接到MySQL，请检查配置');
    process.exit(1);
  }
  
  try {
    // 1. 检查并添加users表字段
    console.log('\n【1】更新 users 表...');
    const [cols] = await conn.query('DESCRIBE users');
    const fields = cols.map(c => c.Field);
    
    if (!fields.includes('username')) {
      await conn.query('ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE COMMENT "用户名" AFTER phone');
      console.log('  ✓ 添加 username 字段');
    } else {
      console.log('  - username 字段已存在');
    }
    
    if (!fields.includes('email')) {
      await conn.query('ALTER TABLE users ADD COLUMN email VARCHAR(100) UNIQUE COMMENT "邮箱" AFTER username');
      console.log('  ✓ 添加 email 字段');
    } else {
      console.log('  - email 字段已存在');
    }
    
    if (!fields.includes('password')) {
      await conn.query('ALTER TABLE users ADD COLUMN password VARCHAR(255) COMMENT "密码" AFTER email');
      console.log('  ✓ 添加 password 字段');
    } else {
      console.log('  - password 字段已存在');
    }
    
    // 2. 创建 user_ai_configs 表
    console.log('\n【2】创建 user_ai_configs 表...');
    try {
      await conn.query(`CREATE TABLE IF NOT EXISTS user_ai_configs (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户AI配置表'`);
      console.log('  ✓ user_ai_configs 表创建成功');
    } catch(e) {
      if (e.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('  - user_ai_configs 表已存在');
      } else throw e;
    }
    
    // 3. 创建 ai_usage_logs 表
    console.log('\n【3】创建 ai_usage_logs 表...');
    try {
      await conn.query(`CREATE TABLE IF NOT EXISTS ai_usage_logs (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        user_id BIGINT NOT NULL,
        config_id BIGINT COMMENT '使用的配置ID',
        type VARCHAR(20) DEFAULT 'ai' COMMENT '使用类型',
        tokens_used INT DEFAULT 0 COMMENT '使用的Token数',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_date (user_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI使用日志表'`);
      console.log('  ✓ ai_usage_logs 表创建成功');
    } catch(e) {
      if (e.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('  - ai_usage_logs 表已存在');
      } else throw e;
    }
    
    // 4. 显示最终表结构
    console.log('\n【4】验证表结构...');
    const [finalCols] = await conn.query('DESCRIBE users');
    console.log('  users 表字段:', finalCols.map(c => c.Field).join(', '));
    
    console.log('\n✅ 数据库迁移完成!');
    
  } finally {
    await conn.end();
  }
}

migrate().catch(err => {
  console.error('\n❌ 迁移失败:', err.message);
  process.exit(1);
});
