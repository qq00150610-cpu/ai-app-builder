# 云端AI应用开发打包平台

一款支持手机端全流程操作的AI低代码应用开发工具，用户通过可视化操作+AI辅助，快速生成并打包APK应用。

## 项目结构

```
云端AI应用开发平台/
├── server/                 # 后端服务
│   ├── src/
│   │   ├── config/        # 配置文件
│   │   ├── controllers/   # 控制器
│   │   ├── middleware/    # 中间件
│   │   ├── routes/        # 路由
│   │   └── index.js       # 入口文件
│   ├── .env.example       # 环境变量示例
│   └── package.json
│
├── app/                    # 前端App (React Native)
│   ├── src/
│   │   ├── screens/       # 页面组件
│   │   ├── services/      # API和状态管理
│   │   ├── components/    # 公共组件
│   │   └── App.js         # 入口文件
│   └── package.json
│
├── database/               # 数据库
│   └── init.sql           # 初始化脚本
│
├── docs/                   # 文档
│
└── 技术方案.md             # 详细技术方案
```

## 快速开始

### 1. 数据库配置

```bash
# 创建数据库并导入表结构
mysql -u root -p < database/init.sql
```

### 2. 后端服务

```bash
cd server

# 安装依赖
npm install

# 复制环境变量
cp .env.example .env

# 编辑 .env 文件，配置数据库、Redis、AI等参数

# 启动服务
npm run dev
```

### 3. 前端App

```bash
cd app

# 安装依赖
npm install

# iOS
npm run ios

# Android
npm run android
```

## 核心功能

### 会员体系
| 类型 | 价格 | 权益 |
|------|------|------|
| 免费用户 | ¥0 | 每日1次打包，每日10次AI调用 |
| 年度会员 | ¥9.9/年 | 无限打包，无限AI，优先编译 |
| 永久会员 | ¥99 | 永久权益，优先客服 |

### AI接入方式
- **平台默认AI**：用户无需配置即可使用，免费用户限额
- **云端模型**：支持 OpenAI、Claude、DeepSeek、通义千问等
- **本地模型**：支持 Ollama 等本地部署模型

### 应用类型
- WebView封装应用
- 工具类应用
- 展示类应用
- 简易交互应用

## API接口

### 认证
- `POST /api/auth/send-code` - 发送验证码
- `POST /api/auth/login` - 手机号登录
- `POST /api/auth/wechat-login` - 微信登录

### 用户
- `GET /api/user/info` - 获取用户信息
- `GET /api/user/membership` - 获取会员状态
- `GET /api/user/ai-configs` - 获取AI配置列表
- `POST /api/user/ai-configs` - 添加AI配置

### 项目
- `GET /api/project/list` - 项目列表
- `POST /api/project/create` - 创建项目
- `PUT /api/project/:id` - 更新项目
- `DELETE /api/project/:id` - 删除项目

### AI
- `POST /api/ai/chat` - AI对话
- `POST /api/ai/generate-page` - 生成页面结构
- `POST /api/ai/test-config` - 测试AI配置

### 构建
- `POST /api/build/submit` - 提交构建任务
- `GET /api/build/status/:taskId` - 查询构建状态
- `GET /api/build/download/:taskId` - 下载APK

### 支付
- `GET /api/payment/packages` - 获取会员套餐
- `POST /api/payment/create-order` - 创建订单
- `GET /api/payment/order/:orderNo` - 查询订单

## 技术栈

### 后端
- Node.js + Express
- MySQL 8.0
- Redis
- 阿里云OSS

### 前端
- React Native
- React Navigation
- Zustand (状态管理)
- Axios

## 部署建议

### 服务器配置
- API服务器：4核8G，¥200-300/月
- 编译服务器：8核16G，¥400-600/月
- 数据库：云MySQL，¥100-200/月
- 对象存储：按量计费

### 云服务商
推荐阿里云或腾讯云，稳定性好，国内访问速度快。

## 开发计划

- [x] 用户系统
- [x] 会员与支付
- [x] AI服务集成
- [x] 项目编辑器
- [x] 云端打包
- [ ] 可视化拖拽编辑器完善
- [ ] 模板市场
- [ ] 项目分享协作
- [ ] iOS版本支持

## 许可证

MIT License
