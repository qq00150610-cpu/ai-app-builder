const { getDB } = require('../config/database');

// 获取项目列表
async function getList(req, res) {
  try {
    const { page = 1, size = 20 } = req.query;
    const offset = (page - 1) * size;
    const db = getDB();
    
    const [projects] = await db.query(
      `SELECT id, name, description, status, created_at, updated_at 
       FROM projects 
       WHERE user_id = ? 
       ORDER BY updated_at DESC 
       LIMIT ? OFFSET ?`,
      [req.user.id, parseInt(size), offset]
    );
    
    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) as total FROM projects WHERE user_id = ?',
      [req.user.id]
    );
    
    res.json({
      success: true,
      data: {
        list: projects,
        pagination: {
          page: parseInt(page),
          size: parseInt(size),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 获取项目详情
async function getDetail(req, res) {
  try {
    const { id } = req.params;
    const db = getDB();
    
    const [projects] = await db.query(
      'SELECT * FROM projects WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    
    if (!projects[0]) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }
    
    res.json({ success: true, data: projects[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 创建项目
async function create(req, res) {
  try {
    const { name, description, config } = req.body;
    const db = getDB();
    
    const [result] = await db.query(
      `INSERT INTO projects (user_id, name, description, config, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
      [req.user.id, name, description, JSON.stringify(config || {})]
    );
    
    res.json({
      success: true,
      data: { id: result.insertId, name, description }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 更新项目
async function update(req, res) {
  try {
    const { id } = req.params;
    const { name, description, config } = req.body;
    const db = getDB();
    
    await db.query(
      `UPDATE projects 
       SET name = ?, description = ?, config = ?, updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [name, description, JSON.stringify(config), id, req.user.id]
    );
    
    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 删除项目
async function deleteProject(req, res) {
  try {
    const { id } = req.params;
    const db = getDB();
    
    await db.query('DELETE FROM projects WHERE id = ? AND user_id = ?', [id, req.user.id]);
    
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 复制项目
async function copy(req, res) {
  try {
    const { id } = req.params;
    const db = getDB();
    
    const [projects] = await db.query(
      'SELECT * FROM projects WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    
    if (!projects[0]) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }
    
    const project = projects[0];
    const [result] = await db.query(
      `INSERT INTO projects (user_id, name, description, config, status, created_at, updated_at)
       VALUES (?, CONCAT(?, ' (副本)'), ?, ?, 1, NOW(), NOW())`,
      [req.user.id, project.name, project.description, project.config]
    );
    
    res.json({
      success: true,
      data: { id: result.insertId }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getList,
  getDetail,
  create,
  update,
  delete: deleteProject,
  copy
};
