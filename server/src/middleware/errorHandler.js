function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ success: false, message: '未授权' });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误'
  });
}

module.exports = errorHandler;
