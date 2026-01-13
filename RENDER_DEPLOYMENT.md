# Render部署指南

本指南将帮助您在Render平台上部署「礼物展示及书信展示」项目。

## 准备工作

### 1. GitHub仓库准备

1. 在GitHub上创建一个新的仓库（如：`gift-letter-show`）
2. 将本地项目代码推送到GitHub仓库

```bash
# 在项目根目录执行以下命令
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/gift-letter-show.git
git push -u origin main
```

### 2. Render账户准备

1. 访问 [Render官网](https://render.com/) 并注册账户
2. 登录Render账户

## 部署步骤

### 1. 部署后端服务

1. 在Render dashboard点击「New +」→「Web Service」
2. 选择您的GitHub仓库
3. 配置部署选项：
   - **Name**: `gift-letter-backend`
   - **Runtime**: `Node.js`
   - **Build Command**: `npm install`
   - **Start Command**: `node app.js`
   - **Working Directory**: `backend`
   - **Environment Variables**: 添加 `NODE_ENV=production`
4. 点击「Create Web Service」开始部署
5. 部署完成后，记录下后端服务的URL（如：`https://gift-letter-backend.onrender.com`）

### 2. 部署前端服务

1. 在Render dashboard点击「New +」→「Static Site」
2. 选择您的GitHub仓库
3. 配置部署选项：
   - **Name**: `gift-letter-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Environment Variables**: 
     - 添加 `NODE_ENV=production`
     - 添加 `REACT_APP_API_URL` 并设置为后端服务的URL（如：`https://gift-letter-backend.onrender.com`）
4. 点击「Create Static Site」开始部署
5. 部署完成后，记录下前端服务的URL（如：`https://gift-letter-frontend.onrender.com`）

## 环境配置

### 前端配置

前端代码已经配置为从全局变量 `REACT_APP_API_URL` 获取后端API地址，若未设置则默认使用当前域名。

### 后端配置

后端服务默认监听在 `process.env.PORT` 端口（Render会自动设置），若未设置则使用3000端口。

## 验证部署

1. 访问前端服务URL（如：`https://gift-letter-frontend.onrender.com/edit.html`）
2. 尝试上传礼物素材，验证文件是否能成功上传到后端
3. 尝试生成展示包，验证功能是否正常
4. 访问后端健康检查API（如：`https://gift-letter-backend.onrender.com/api/health`），确认后端服务正常运行

## 注意事项

1. **Render免费计划限制**：
   - 免费计划的服务会在闲置30分钟后自动休眠
   - 每次启动服务可能需要1-2分钟的冷启动时间

2. **文件存储**：
   - 后端服务的文件存储是临时的，重启后文件会丢失
   - 若需要持久化存储，建议使用Render的Disk存储或其他云存储服务

3. **域名配置**：
   - Render提供免费的 `.onrender.com` 域名
   - 您也可以配置自定义域名

4. **环境变量**：
   - 确保在前端服务中正确设置了 `REACT_APP_API_URL` 环境变量，指向后端服务的URL

## 故障排查

### 常见问题

1. **前端无法上传文件**：
   - 检查 `REACT_APP_API_URL` 是否正确设置
   - 检查后端服务是否正常运行
   - 检查浏览器控制台是否有网络错误

2. **后端服务启动失败**：
   - 检查Render日志，查看错误信息
   - 确保 `package.json` 中的依赖正确
   - 确保 `app.js` 中的端口配置正确

3. **生成的展示包无法正常显示**：
   - 检查后端服务是否正常运行（素材存储在后端）
   - 检查生成的ZIP包中是否包含正确的文件

### 日志查看

- 在Render dashboard中，点击对应的服务，然后选择「Logs」标签页查看日志

## 联系支持

如果您在部署过程中遇到问题，可以：

1. 查看 [Render官方文档](https://render.com/docs)
2. 在Render dashboard中点击「Help」→「Contact Support」联系Render支持

---

部署完成后，您就可以通过前端服务的URL访问和使用「礼物展示及书信展示」应用了！