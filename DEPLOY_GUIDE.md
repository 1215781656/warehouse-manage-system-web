# 腾讯云服务器部署指南 (本地构建版)

本指南采用**本地构建 + 上传构建产物**的方式，避免服务器内存不足导致构建失败。

## 1. 准备工作 (本地操作)

1.  **修复构建配置** (已完成)：我已经帮你修复了 `package.json` 和 `tsconfig` 相关配置。
2.  **执行构建**：
    在你的 VSCode 终端中运行：
    ```bash
    yarn build
    ```
    成功后，项目根目录下会生成一个 `dist` 文件夹。

## 2. 上传文件到服务器

请将以下文件/文件夹上传到服务器的 `/root/warehouse-manage-system-web/` (或其他你指定的目录)：

**必须上传：**

- `dist/` 文件夹 (刚刚构建生成的)
- `server/` 文件夹 (后端代码)
- `Dockerfile` (已更新为纯静态部署模式)
- `docker-compose.yml`
- `nginx.conf`

**不需要上传：**

- `node_modules/`
- `src/` (前端源码不需要了，因为已经编译成 dist)

## 3. 服务器端部署

登录服务器，进入项目目录，执行以下命令：

```bash
# 1. 停止旧容器 (如果有)
docker compose down

# 2. 启动服务
# --build 参数确保使用新的 Dockerfile 重新构建镜像
docker compose up -d --build
```

## 4. 验证

访问 `http://你的服务器IP/`，应该能正常看到登录页。
访问 `http://你的服务器IP/api/`，应该能看到后端响应（如果后端有根路由处理的话，或者测试登录功能）。

## 5. 常见问题排查

- **404 Not Found**:

  - 检查 `dist` 目录是否完整上传。
  - 检查 `nginx.conf` 是否正确上传。
  - 运行 `docker compose logs frontend` 查看 Nginx 启动日志。

- **后端连接失败**:
  - 检查后端服务是否启动：`docker compose logs backend`
  - 检查数据库连接是否正常。
