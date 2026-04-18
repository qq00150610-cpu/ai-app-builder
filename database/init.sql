-- 创建数据库
CREATE DATABASE IF NOT EXISTS ai_app_builder DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE ai_app_builder;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    phone VARCHAR(20) UNIQUE,
    username VARCHAR(50) UNIQUE COMMENT '用户名',
    email VARCHAR(100) UNIQUE COMMENT '邮箱',
    password VARCHAR(255) COMMENT '密码（bcrypt加密）',
    wechat_openid VARCHAR(64) UNIQUE,
    nickname VARCHAR(50),
    avatar VARCHAR(255),
    member_type TINYINT DEFAULT 0 COMMENT '0:免费 1:年费 2:永久',
    member_expire_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone),
    INDEX idx_openid (wechat_openid),
    INDEX idx_email (email),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 用户AI配置表
CREATE TABLE IF NOT EXISTS user_ai_configs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    config_name VARCHAR(50),
    model_type VARCHAR(20) COMMENT 'openai/claude/deepseek/qwen/ollama',
    api_endpoint VARCHAR(255),
    api_key VARCHAR(255),
    model_name VARCHAR(50),
    temperature DECIMAL(2,1) DEFAULT 0.7,
    max_tokens INT DEFAULT 2048,
    is_default TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户AI配置表';

-- 项目表
CREATE TABLE IF NOT EXISTS projects (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    name VARCHAR(100),
    description TEXT,
    config JSON COMMENT '项目配置JSON',
    status TINYINT DEFAULT 1 COMMENT '1:编辑中 2:编译中 3:已完成',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目表';

-- 构建任务表
CREATE TABLE IF NOT EXISTS build_tasks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    status TINYINT DEFAULT 0 COMMENT '0:排队中 1:编译中 2:成功 3:失败 4:已取消',
    apk_url VARCHAR(255),
    error_msg TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='构建任务表';

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(32) UNIQUE,
    user_id BIGINT NOT NULL,
    product_type TINYINT COMMENT '1:年费 2:永久',
    amount DECIMAL(10,2),
    pay_method VARCHAR(20) COMMENT 'wechat/alipay',
    pay_status TINYINT DEFAULT 0 COMMENT '0:待支付 1:已支付 2:已退款',
    trade_no VARCHAR(64),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_order_no (order_no),
    INDEX idx_user (user_id),
    INDEX idx_status (pay_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- AI使用日志表
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    config_id BIGINT,
    tokens_used INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI使用日志表';

-- 模板表（可选，用于用户自定义模板）
CREATE TABLE IF NOT EXISTS templates (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    name VARCHAR(100),
    category VARCHAR(50),
    description TEXT,
    config JSON,
    is_public TINYINT DEFAULT 0,
    use_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_category (category),
    INDEX idx_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='模板表';

-- 为已存在的表添加新字段（如果表已存在）
-- ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE COMMENT '用户名';
-- ALTER TABLE users ADD COLUMN email VARCHAR(100) UNIQUE COMMENT '邮箱';
-- ALTER TABLE users ADD COLUMN password VARCHAR(255) COMMENT '密码';
