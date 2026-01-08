# 部署指南

## 部署到 Vercel

### 方法一：通过 Vercel 面板部署（推荐）

1. **准备 GitHub 仓库**
   ```bash
   # 如果还没有 GitHub 仓库，先创建一个
   # 在 https://github.com/new 创建新仓库
   
   # 添加远程仓库（替换 YOUR_USERNAME/REPO_NAME）
   git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
   
   # 推送到 GitHub
   git branch -M main
   git push -u origin main
   ```

2. **在 Vercel 中导入项目**
   - 访问 https://vercel.com/new
   - 选择 "Git" 选项
   - 选择刚才创建的 GitHub 仓库
   - Vercel 会自动检测到这是 Next.js 项目

3. **配置环境变量**
   在 Vercel 项目设置中添加以下环境变量：
   ```
   GOOGLE_AI_API_KEY=你的Google_AI_API_Key
   ```
   
   获取 API Key: https://makersuite.google.com/app/apikey

4. **部署**
   - 点击 "Deploy" 按钮
   - 等待部署完成（约1-2分钟）
   - Vercel 会提供一个 `.vercel.app` 域名

### 方法二：使用 Vercel CLI

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   ```bash
   cd smartgrader
   vercel
   ```

4. **按照提示配置**
   - 选择 "Link to existing project"
   - 或者创建新项目
   - 配置环境变量

### 方法三：直接从 GitHub 部署

1. **推送代码到 GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

2. **在 Vercel 中导入**
   - 访问 https://vercel.com/new
   - 选择你的 GitHub 仓库
   - 配置环境变量
   - 部署

## 部署到其他平台

### Netlify

1. 在 https://app.netlify.com 创建新站点
2. 选择 "Import an existing project"
3. 连接 GitHub 仓库
4. 构建命令：`npm run build`
5. 发布目录：`.next`
6. 配置环境变量：`GOOGLE_AI_API_KEY`

### Railway

1. 在 https://railway.app 创建新项目
2. 选择 "Deploy from GitHub repo"
3. 配置环境变量
4. 部署

## 环境变量配置

所有平台都需要配置以下环境变量：

| 变量名 | 必需 | 说明 | 获取方式 |
|---------|-------|------|----------|
| `GOOGLE_AI_API_KEY` | 是 | Google AI API 密钥 | https://makersuite.google.com/app/apikey |
| `NEXT_PUBLIC_SUPABASE_URL` | 否 | Supabase 数据库 URL（未来功能） | - |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 否 | Supabase 匿名密钥（未来功能） | - |

## 域名配置

### Vercel 自定义域名

1. 在 Vercel 项目设置中点击 "Domains"
2. 添加你的自定义域名
3. 根据提示配置 DNS 记录

### GitHub Pages

Next.js 项目不适合直接部署到 GitHub Pages，建议使用 Vercel。

## 故障排除

### 部署失败

1. **检查环境变量**
   - 确保 `GOOGLE_AI_API_KEY` 已正确配置
   - API Key 应该以 `AIza` 开头

2. **检查构建日志**
   - 在 Vercel 面板查看部署日志
   - 修复构建错误

3. **Node.js 版本**
   - 确保 Node.js 版本 >= 18.17
   - 在 `package.json` 中指定版本：

```json
{
  "engines": {
    "node": ">=18.17"
  }
}
```

### 运行时错误

1. **API Key 未设置**
   ```
   Error: GOOGLE_AI_API_KEY is not set
   ```
   检查环境变量是否正确配置

2. **API 配额限制**
   - Google AI API 有免费额度限制
   - 查看使用情况：https://makersuite.google.com/app/usagereport

## 性能优化

### 生产环境建议

1. **启用图片优化**
   - Vercel 自动优化 Next.js 图片
   - 确保使用 `next/image` 组件

2. **配置 CDN**
   - Vercel 自动提供全球 CDN
   - 无需额外配置

3. **启用 ISR（增量静态再生）**
   - 在 `app/page.tsx` 中添加 `revalidate` 选项
   - 减少服务器负载

## 监控和分析

### Vercel Analytics

1. 在 Vercel 项目设置中启用 Analytics
2. 查看用户访问数据
3. 监控性能指标

### 错误追踪

考虑集成 Sentry 等错误追踪工具：
```bash
npm install @sentry/nextjs
```

## 更新部署

部署到 GitHub 后，只需推送新代码：

```bash
git add .
git commit -m "your commit message"
git push
```

Vercel 会自动触发新的部署。

## 本地测试部署

在生产环境部署前，先本地测试：

```bash
# 本地构建测试
npm run build

# 本地启动生产版本
npm run start
```

访问 http://localhost:3000 测试。