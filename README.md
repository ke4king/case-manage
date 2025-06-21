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

## 环境要求

- Node.js 18+
- npm 9+
- Wrangler CLI (`npm install -g wrangler`)

## 开发环境配置

### 前端开发

```bash
cd frontend
npm install
npm run dev  # 开发模式
```

### 后端开发

```bash
cd backend
npm install
npx wrangler dev  # 本地开发模式
```

## 手动部署流程

### 1. 环境准备

1. 安装 Wrangler CLI：
   ```bash
   npm install -g wrangler
   ```

2. 登录到 Cloudflare：
   ```bash
   wrangler login
   ```

### 2. 配置 Cloudflare 服务

1. 创建并配置 D1 数据库：
   ```bash
   # 创建数据库
   wrangler d1 create case-management
   
   # 更新 wrangler.toml 中的 database_id
   # [[d1_databases]]
   # binding = "DB"
   # database_name = "case-management"
   # database_id = "你的数据库ID"
   
   # 执行数据库迁移
   cd backend
   wrangler d1 execute case-management --file=./migrations/init.sql
   ```

2. 创建 R2 存储桶：
   ```bash
   wrangler r2 bucket create case-files
   ```

3. 设置必要的环境变量：
   ```bash
   # JWT 密钥
   wrangler secret put JWT_SECRET
   
   # 管理员账户信息
   wrangler secret put ADMIN_USERNAME
   wrangler secret put ADMIN_PASSWORD
   
   # Turnstile 配置
   wrangler secret put TURNSTILE_SECRET_KEY
   ```

### 3. 部署步骤

1. 构建前端：
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. 部署到 Cloudflare Workers：
   ```bash
   cd ../backend
   npm install
   wrangler deploy
   ```

### 4. 验证部署

部署完成后，您将获得一个 `.workers.dev` 域名。访问该域名确认部署是否成功。

### 5. 故障排查

如果遇到部署问题，可以：

1. 检查 wrangler.toml 配置是否正确
2. 确认所有环境变量是否已设置
3. 查看 Cloudflare Dashboard 中的错误日志
4. 使用 `wrangler tail` 命令查看实时日志

## 配置文件

1. 前端配置：`frontend/vite.config.js`
2. 后端配置：`backend/wrangler.toml`

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

## 许可证

私有项目，未授权禁止使用

## 开发者

- 案件管理团队

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