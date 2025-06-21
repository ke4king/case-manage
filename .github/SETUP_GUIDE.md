# GitHub Actions 自动部署设置指南

此文档提供如何设置 GitHub Actions 自动部署到 Cloudflare 的步骤。

## 前置条件

1. 拥有 Cloudflare 账户
2. 已创建 Cloudflare Workers、D1 数据库和 R2 存储桶
3. GitHub 仓库已设置好

## 步骤

### 1. 创建 Cloudflare API 令牌

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 "我的个人资料" > "API 令牌"
3. 点击 "创建令牌"
4. 选择 "编辑 Cloudflare Workers" 模板
5. 确保令牌具有以下权限：
   - Account > Workers Scripts > Edit
   - Account > Workers KV Storage > Edit
   - Account > D1 > Edit
   - Account > R2 Storage > Edit
6. 创建令牌并复制生成的令牌值

### 2. 在 GitHub 中设置秘密

1. 打开您的 GitHub 仓库
2. 进入 "Settings" > "Secrets and variables" > "Actions"
3. 点击 "New repository secret"
4. 添加以下秘密：
   - 名称: `CLOUDFLARE_API_TOKEN`
     值: 您在步骤 1 中创建的 Cloudflare API 令牌
   - 名称: `JWT_SECRET`
     值: 用于 JWT 签名的安全随机字符串（至少16位）
   - 名称: `ADMIN_PASSWORD`
     值: 管理员账户的安全密码

### 3. 检查工作流配置

确保 `.github/workflows/cloudflare-deploy.yml` 文件已正确配置，并且推送到您的仓库。

### 4. 触发部署

有两种方式触发部署：
1. 推送代码到 `main` 分支
2. 在 GitHub 仓库的 "Actions" 选项卡中手动运行工作流

## 故障排除

如果部署失败，请检查以下几点：

1. 确保 API 令牌有效且具有正确的权限
2. 检查 GitHub Actions 日志以获取详细错误信息
3. 验证 `wrangler.toml` 中的配置是否正确
4. 确保您的 Cloudflare 账户已激活 Workers、D1 和 R2 服务 