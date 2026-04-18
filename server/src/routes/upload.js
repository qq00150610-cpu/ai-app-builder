const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const uploadController = require('../controllers/upload');
const authMiddleware = require('../middleware/auth');

// 配置 multer 存储
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB限制
  },
  fileFilter: (req, file, cb) => {
    // 允许的文件类型
    const allowedTypes = [
      '.zip', '.js', '.ts', '.jsx', '.tsx',
      '.json', '.xml', '.yaml', '.yml',
      '.java', '.kt', '.swift', '.py',
      '.html', '.css', '.scss', '.less'
    ];
    
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = [
      '.zip', '.js', '.ts', '.jsx', '.tsx',
      '.json', '.xml', '.yaml', '.yml',
      '.java', '.kt', '.swift', '.py',
      '.html', '.css', '.scss', '.less',
      '.md', '.txt', '.gitignore', '.env',
      '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp',
      '.ttf', '.woff', '.woff2', '.eot'
    ];
    
    // 检查文件扩展名
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型: ' + ext), false);
    }
  }
});

// 上传项目文件
router.post('/project', authMiddleware, upload.single('file'), uploadController.uploadProject);

// 分析项目结构
router.post('/analyze', authMiddleware, uploadController.analyzeProject);

// AI查错
router.post('/check-errors', authMiddleware, uploadController.checkErrors);

// AI修复错误
router.post('/fix-errors', authMiddleware, uploadController.fixErrors);

// 创建项目（从上传）
router.post('/create-project', authMiddleware, uploadController.createFromUpload);

// 删除上传文件
router.post('/delete', authMiddleware, uploadController.deleteUpload);

// 错误处理中间件
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        message: '文件大小超出限制，最大支持100MB' 
      });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  
  next();
});

module.exports = router;
