#!/bin/bash
# 阿里云服务器一键部署脚本
# 直接在服务器上执行此脚本

# ===== 配置区域 =====
DB_PASSWORD="mm900236.."  # 数据库密码
AI_API_KEY=""             # AI API Key（需要填写）
OSS_ACCESS_KEY=""         # 阿里云OSS Key（需要填写）
OSS_SECRET=""             # 阿里云OSS Secret（需要填写）
# ===================

set -e
echo "=== 开始部署 ==="

# 1. 安装基础环境
apt update
apt install -y curl wget git

# 2. 安装Node.js 18
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi
node --version

# 3. 安装MySQL
if ! command -v mysql &> /dev/null; then
    apt install -y mysql-server
    systemctl start mysql
    systemctl enable mysql
fi

# 4. 安装Redis
if ! command -v redis-server &> /dev/null; then
    apt install -y redis-server
    systemctl start redis
    systemctl enable redis
fi

# 5. 创建项目目录
mkdir -p /opt/ai-app-builder
cd /opt/ai-app-builder

# 6. 克隆代码
if [ ! -d "server" ]; then
    git clone https://github.com/qq00150610-cpu/ai-app-builder.git .
fi

# 7. 初始化数据库
mysql -u root << 'EOF'
CREATE DATABASE IF NOT EXISTS ai_app_builder DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF

mysql -u root ai_app_builder < /opt/ai-app-builder/database/init.sql
echo "数据库初始化完成"

# 8. 配置后端
cd /opt/ai-app-builder/server
npm install

# 9. 创建环境变量
cat > .env << EOF
# 服务器配置
PORT=3000
NODE_ENV=production

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=ai_app_builder

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT配置
JWT_SECRET=ai_app_builder_secret_key_$(date +%s)
JWT_EXPIRES_IN=7d

# 平台默认AI配置
DEFAULT_AI_PROVIDER=openai
DEFAULT_AI_API_KEY=${AI_API_KEY}
DEFAULT_AI_BASE_URL=https://api.openai.com/v1
DEFAULT_AI_MODEL=gpt-4o-mini

# OSS配置
OSS_ACCESS_KEY_ID=${OSS_ACCESS_KEY}
OSS_ACCESS_KEY_SECRET=${OSS_SECRET}
OSS_BUCKET=your-bucket-name
OSS_REGION=oss-cn-beijing
EOF

echo "环境配置已创建，请编辑 /opt/ai-app-builder/server/.env 填写完整信息"

# 10. 安装PM2
npm install -g pm2

# 11. 启动服务
pm2 start src/index.js --name ai-app-builder
pm2 save
pm2 startup | tail -1 | bash

# 12. 配置防火墙
ufw allow 3000/tcp
ufw allow 22/tcp
ufw --force enable

echo ""
echo "=== 部署完成 ==="
echo "API地址: http://$(curl -s ifconfig.me):3000"
echo ""
echo "后续操作："
echo "1. 编辑配置文件: vim /opt/ai-app-builder/server/.env"
echo "2. 重启服务: pm2 restart ai-app-builder"
echo "3. 查看日志: pm2 logs ai-app-builder"
