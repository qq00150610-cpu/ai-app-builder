require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { connectDB, connectRedis } = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const projectRoutes = require('./routes/project');
const aiRoutes = require('./routes/ai');
const buildRoutes = require('./routes/build');
const paymentRoutes = require('./routes/payment');
const templateRoutes = require('./routes/template');
const uploadRoutes = require('./routes/upload');
const migrateRoutes = require('./routes/migrate');
const indexRoutes = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 限流
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// 路由
app.use('/', indexRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/build', buildRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/template', templateRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/migrate', migrateRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use(errorHandler);

// 启动服务
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDB();
    console.log('✅ 数据库连接成功');
    
    await connectRedis();
    console.log('✅ Redis连接成功');
    
    app.listen(PORT, () => {
      console.log(`🚀 服务运行在 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ 启动失败:', error);
    process.exit(1);
  }
}

startServer();
