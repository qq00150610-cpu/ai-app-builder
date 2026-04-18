#!/bin/bash
cd /opt/ai-app-builder/server
npm install --registry=https://registry.npmmirror.com

# 创建环境变量
cat > .env << 'EOF'
PORT=3000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=ai_app_builder
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=ai_app_builder_jwt_secret_2026
JWT_EXPIRES_IN=7d
DEFAULT_AI_PROVIDER=openai
DEFAULT_AI_API_KEY=sk-your-api-key
DEFAULT_AI_BASE_URL=https://api.openai.com/v1
DEFAULT_AI_MODEL=gpt-4o-mini
EOF

# 安装PM2并启动
npm install -g pm2
pm2 start src/index.js --name ai-app-builder
pm2 save
pm2 startup | tail -1 | bash

echo "部署完成！"
curl http://localhost:3000/health
