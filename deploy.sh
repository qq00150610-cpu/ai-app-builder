#!/bin/bash
# 部署脚本 - 在阿里云服务器上执行

set -e

echo "=== 开始部署云端AI应用开发平台 ==="

# 安装依赖
apt update
apt install -y nodejs npm mysql-server redis-server

# 安装Node版本管理器
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 创建项目目录
mkdir -p /opt/ai-app-builder
cd /opt/ai-app-builder

# 克隆代码
git clone https://github.com/qq00150610-cpu/ai-app-builder.git .

# 进入后端目录
cd server

# 安装依赖
npm install

# 复制环境变量模板
if [ ! -f .env ]; then
    cp .env.example .env
    echo "请编辑 /opt/ai-app-builder/server/.env 配置数据库和AI信息"
fi

# 初始化数据库
echo "请手动执行数据库初始化: mysql -u root -p < /opt/ai-app-builder/database/init.sql"

# 安装PM2进程管理器
npm install -g pm2

# 启动服务
pm2 start src/index.js --name ai-app-builder
pm2 save
pm2 startup

echo "=== 部署完成 ==="
echo "API地址: http://$(curl -s ifconfig.me):3000"
echo "请修改 .env 文件配置数据库和AI信息后重启: pm2 restart ai-app-builder"
