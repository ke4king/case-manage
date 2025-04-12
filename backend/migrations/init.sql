-- users 表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  hashed_password TEXT NOT NULL,
  email TEXT UNIQUE,
  full_name TEXT,
  is_active BOOLEAN DEFAULT 1,
  is_superuser BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- cases 表
CREATE TABLE IF NOT EXISTS cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_number TEXT NOT NULL UNIQUE,
  case_name TEXT NOT NULL,
  case_types TEXT NOT NULL, -- JSON 字符串存储案件类型列表
  operation_date DATE NOT NULL,
  platform_types TEXT NOT NULL, -- JSON 字符串存储平台类型列表
  customer_service TEXT,
  other_info TEXT,
  
  -- 技术信息
  has_technical_info BOOLEAN DEFAULT 0,
  cdn_info TEXT,
  server_location_domestic BOOLEAN,
  server_location TEXT, -- JSON 字符串存储服务器位置信息
  permissions TEXT, -- JSON 字符串存储已获得的权限列表
  
  -- 数据分析
  platform_analysis TEXT,
  agent_analysis TEXT,
  member_analysis TEXT,
  
  -- 软删除标记
  is_deleted BOOLEAN DEFAULT 0,
  deleted_at TIMESTAMP,
  
  -- 元数据
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 分享功能
  token TEXT, -- 合并自 add_token_field.sql
  
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 文件表，用于 R2 存储的元数据
CREATE TABLE IF NOT EXISTS case_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- R2 存储路径
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by INTEGER,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (case_id) REFERENCES cases(id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- 为 token 创建索引以加快查询速度 (来自 add_token_field.sql)
CREATE INDEX IF NOT EXISTS idx_cases_token ON cases(token);
