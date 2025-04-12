# 案件管理系统

基于 Cloudflare Workers 构建的现代化案件管理系统，提供案件信息的创建、存储、检索和分析功能。

## 项目结构

本项目分为前端和后端两部分：

### 前端 (frontend/)

- 基于 Vue 3 + Vite 构建
- Element Plus UI 组件库
- Pinia 状态管理
- Vue Router 路由管理

### 后端 (backend/)

- 基于 Cloudflare Workers 构建
- 使用 Cloudflare D1 (SQLite) 作为数据库
- 使用 Cloudflare R2 存储附件
- Hono.js 作为 Web 框架

## 功能特性

- 用户认证与授权
- 案件管理（创建、查看、编辑、删除）
- 文件上传与管理
- PDF 导出
- 响应式设计，适配移动设备

## 安装与使用

### 前端

```bash
cd frontend
npm install
npm run dev  # 开发模式
npm run build  # 生产构建
```

### 后端

```bash
cd backend
npm install
npx wrangler dev --env dev  # 开发模式
npx wrangler deploy  # 部署到 Cloudflare Workers
```

## 环境要求

- Node.js 18+
- npm 9+
- Wrangler CLI (`npm install -g wrangler`)

## 配置

1. 前端配置文件：`frontend/vite.config.js`
2. 后端配置文件：`backend/wrangler.toml`

## 开发者

- 案件管理团队

## 许可证

私有项目，未授权禁止使用

## 技术栈

- **后端**：
  - Cloudflare Workers
  - Hono.js (Web 框架)
  - D1 数据库 (SQLite 兼容)
  - R2 存储服务
  - Jose (JWT 实现)

- **前端**：
  - Vue 3
  - Element Plus
  - Pinia (状态管理)
  - Vue Router
  - MD Editor V3 (Markdown 编辑与预览)
  - Axios (HTTP 客户端)

## 项目结构

本项目采用前后端分离的架构:

```
case-management-cloudflare/
├── backend/               # 后端代码
│   ├── src/               # 源代码
│   ├── migrations/        # 数据库迁移文件
│   ├── wrangler/          # Wrangler相关工具
│   ├── package.json       # 后端依赖配置
│   └── wrangler.toml      # Cloudflare Workers配置
├── frontend/              # 前端代码
│   ├── src/               # 源代码
│   ├── public/            # 静态资源
│   └── package.json       # 前端依赖配置
├── public/                # 构建后的前端资源（用于部署）
└── package.json           # 项目根依赖配置
```

## 开发指南

### 初始安装

首次克隆项目后，安装所有依赖:

```bash
npm run install:all
```

### 开发模式

同时启动前端和后端开发服务器:

```bash
npm run dev
```

仅启动后端:

```bash
npm run dev:backend
```

仅启动前端:

```bash
npm run dev:frontend
```

### 部署

构建前端并部署整个应用:

```bash
npm run deploy
```

## 前提条件

在部署前，您需要：

1. [Cloudflare 账户](https://dash.cloudflare.com/sign-up)
2. [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) 工具
3. Node.js 16+ 环境

## 部署步骤

### 1. 准备工作

1. 登录 Cloudflare 账户并获取 API 令牌：
   - 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 创建 API 令牌，确保有 Workers、D1 和 R2 的权限

2. 安装 Wrangler 并登录：
   ```bash
   npm install -g wrangler
   wrangler login
   ```

3. 克隆项目并安装依赖：
   ```bash
   git clone https://your-repository/case-management-cloudflare.git
   cd case-management-cloudflare
   npm install
   ```

### 2. 创建 D1 数据库

1. 创建新的 D1 数据库：
   ```bash
   wrangler d1 create case-management
   ```

2. 记下输出中的数据库 ID，并更新 `wrangler.toml` 文件中的 `database_id` 字段。

3. 执行迁移脚本创建表结构：
   ```bash
   npm run setup:d1
   ```

### 3. 创建 R2 存储桶

1. 创建用于存储案件文件的 R2 存储桶：
   ```bash
   wrangler r2 bucket create case-files
   wrangler r2 bucket create case-files-dev
   ```

2. 确保在 `wrangler.toml` 中已正确配置了 R2 存储桶信息。

### 4. 配置环境变量

1. 在 `wrangler.toml` 中设置环境变量：
   - 设置 `JWT_SECRET` 为一个安全的随机字符串

2. 或者使用 Cloudflare Dashboard 配置环境变量：
   - 访问 Workers & Pages > case-management > Settings > Variables
   - 添加环境变量 `JWT_SECRET`

### 5. 构建和部署前端

1. 进入前端目录并安装依赖：
   ```bash
   cd frontend
   npm install
   ```

2. 构建前端代码：
   ```bash
   npm run build
   ```
   
   这将自动把构建结果输出到 `../public` 目录（与 Worker 集成）。

### 6. 部署 Worker

1. 回到项目根目录并使用 Wrangler 部署：
   ```bash
   cd ..
   npm run deploy
   ```

2. 部署完成后，您将获得一个 `.workers.dev` 域名，例如 `case-management.your-subdomain.workers.dev`。

### 7. 绑定自定义域名（可选）

如果您想使用自定义域名：

1. 前往 Cloudflare Dashboard > Workers & Pages > case-management > Triggers
2. 点击"添加自定义域"，按照指引完成配置

## 本地开发

### 后端开发

```bash
# 在项目根目录启动 Worker 开发服务器
npm run dev
```

### 前端开发

```bash
# 在另一个终端窗口进入前端目录
cd frontend

# 启动 Vite 开发服务器
npm run dev
```

前端开发服务器将在 http://localhost:5173 上运行，并将 API 请求代理到后端开发服务器。

### 数据库迁移（本地开发）

```bash
wrangler d1 execute case-management-dev --local --file=./migrations/init.sql
```

## 日常运维

### 更新应用

修改代码后，重新构建前端并部署：

```bash
# 构建前端
cd frontend
npm run build

# 部署 Worker
cd ..
npm run deploy
```

### 管理数据库

使用 Wrangler 直接操作 D1 数据库：
```bash
# 查询数据
wrangler d1 execute case-management --command "SELECT * FROM users"

# 导出数据库
wrangler d1 backup case-management
```

### 管理 R2 存储

使用 Wrangler 管理 R2 存储：
```bash
# 列出文件
wrangler r2 object list case-files

# 删除文件
wrangler r2 object delete case-files <key>
```

## 数据备份与恢复

### 备份 D1 数据库

```bash
wrangler d1 backup case-management
```

### 备份 R2 存储

使用 Wrangler 导出 R2 数据：
```bash
wrangler r2 list --json > r2-files-list.json
```

然后可以写一个脚本遍历列表下载所有文件。

## 故障排除

1. **部署失败**：
   - 检查 `wrangler.toml` 配置
   - 确保 API 令牌有足够权限
   - 检查日志：`wrangler tail`

2. **数据库错误**：
   - 验证 D1 实例是否正确绑定
   - 检查 SQL 语法
   - 查看迁移是否成功执行

3. **文件上传失败**：
   - 检查 R2 存储桶权限
   - 验证 R2 绑定是否正确配置
   - 检查文件大小是否超出限制

4. **前端问题**：
   - 检查浏览器控制台错误
   - 验证 API 请求路径是否正确
   - 确保前端构建成功并部署到 public 目录

## 安全注意事项

1. **永远不要**：
   - 硬编码 JWT 密钥或其他敏感信息
   - 在源代码中存储凭据
   - 忽略输入验证

2. **最佳实践**：
   - 使用环境变量存储敏感信息
   - 使用安全的 JWT 配置
   - 定期更新依赖

## 更多资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [Hono.js 文档](https://honojs.dev/)
- [Vue 3 文档](https://v3.vuejs.org/)
- [Element Plus 文档](https://element-plus.org/)

---

*注意：请替换此 README 中的示例命令和链接，以匹配您实际的项目配置和需求。*

# 环境变量配置

本系统使用环境变量来管理关键配置和凭据，提高安全性和灵活性。

## 关键环境变量

在`wrangler.toml`文件中配置以下环境变量：

| 环境变量 | 描述 | 默认值 | 注意事项 |
|---------|------|-------|---------|
| JWT_SECRET | JWT令牌签名密钥 | - | 应使用强随机字符串，至少16位 |
| ENV | 运行环境 | production | 可选值: development, production |
| ADMIN_USERNAME | 默认管理员用户名 | admin | 仅首次部署时使用 |
| ADMIN_PASSWORD | 默认管理员密码 | - | 必须强密码，至少12位 |

## 安全最佳实践

1. **生产环境配置**：
   - 在正式部署前更改所有默认密码和密钥
   - 使用`wrangler secrets`而非`wrangler.toml`存储敏感信息
   - 示例: `wrangler secret put ADMIN_PASSWORD`

2. **管理员账户**：
   - 系统启动时会检查是否已存在管理员账户，若不存在则创建
   - 首次登录后请立即修改默认管理员密码
   - 管理员账户具有完全控制权限，请谨慎管理

3. **密码要求**：
   - 长度至少12位
   - 包含大小写字母、数字和特殊字符
   - 定期更换，不重复使用

4. **JWT配置**：
   - 令牌默认有效期为24小时
   - 可通过修改`generateJWT`函数中的`expiresIn`参数调整

## Cloudflare环境变量管理

### 使用命令行工具

```bash
# 设置JWT密钥
wrangler secret put JWT_SECRET

# 设置管理员密码
wrangler secret put ADMIN_PASSWORD
```

### 使用Cloudflare Dashboard

1. 登录Cloudflare Dashboard
2. 进入Workers & Pages > 您的Worker
3. 点击"Settings" > "Variables"
4. 添加或修改环境变量
5. 选择"Encrypt"选项保护敏感数据

## 注意

- 环境变量优先级: Secrets > wrangler.toml > 默认值
- 修改密钥后需要重新部署应用
- 请勿在代码仓库中提交包含实际密钥的配置文件 