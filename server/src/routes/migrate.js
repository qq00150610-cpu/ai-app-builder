const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const { getDB } = require('../config/database');

/**
 * 执行数据库迁移
 * GET /api/migrate/email-fields
 */
router.get('/email-fields', async (req, res) => {
  try {
    const db = getDB();
    
    console.log('开始数据库迁移...');
    
    // 检查并添加username字段
    try {
      await db.query('ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE COMMENT "用户名" AFTER phone');
      console.log('✓ 添加 username 字段成功');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('- username 字段已存在');
      } else {
        throw e;
      }
    }
    
    // 检查并添加email字段
    try {
      await db.query('ALTER TABLE users ADD COLUMN email VARCHAR(100) UNIQUE COMMENT "邮箱" AFTER username');
      console.log('✓ 添加 email 字段成功');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('- email 字段已存在');
      } else {
        throw e;
      }
    }
    
    // 检查并添加password字段
    try {
      await db.query('ALTER TABLE users ADD COLUMN password VARCHAR(255) COMMENT "密码" AFTER email');
      console.log('✓ 添加 password 字段成功');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('- password 字段已存在');
      } else {
        throw e;
      }
    }
    
    // 验证字段
    const [columns] = await db.query('SHOW COLUMNS FROM users');
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
  }
});

module.exports = router;
