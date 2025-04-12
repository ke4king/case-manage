# 部署状态徽章

您可以在项目 README 中添加 GitHub Actions 工作流状态徽章，以便快速查看最新部署状态。

## 添加部署徽章到 README.md

将以下 Markdown 代码添加到您的 README.md 文件中：

```markdown
[![部署到 Cloudflare](https://github.com/你的用户名/case-management-cloudflare/actions/workflows/cloudflare-deploy.yml/badge.svg)](https://github.com/你的用户名/case-management-cloudflare/actions/workflows/cloudflare-deploy.yml)
```

请将 `你的用户名` 替换为您的 GitHub 用户名或组织名称。

## 示例效果

当徽章添加到 README 后，会显示如下状态：

- ![部署成功](https://img.shields.io/badge/部署-成功-success) - 最新工作流运行成功
- ![部署失败](https://img.shields.io/badge/部署-失败-critical) - 最新工作流运行失败
- ![部署进行中](https://img.shields.io/badge/部署-进行中-yellow) - 工作流正在运行

点击徽章可以直接跳转到 GitHub Actions 页面，查看详细的部署日志和历史记录。 