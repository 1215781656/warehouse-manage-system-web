# 腾讯云服务器部署指南 (本地构建版)

本指南采用**本地构建 + 上传构建产物**的方式，避免服务器内存不足导致构建失败。

## 1. 准备工作 (本地操作)

### 1.1 本地构建

请在项目根目录下打开终端，依次执行以下命令：

```bash
# 1. 构建前端
yarn install
yarn build
# 成功后，根目录下会生成 dist 文件夹

# 2. 构建后端
cd server
yarn install
yarn build
# 成功后，server 目录下会生成 dist 文件夹
```

### 1.2 准备上传文件

请确认你拥有以下文件/文件夹准备上传：

1.  `dist/` (前端构建产物)
2.  `server/` (后端文件夹，**包含** `dist`, `package.json`, `sql`, `server_uploads`, `Dockerfile` 等。**不包含** `node_modules`)
3.  `docker-compose.yml` (根目录)
4.  `nginx.conf` (根目录)

## 2. 上传文件到服务器

请登录你的腾讯云服务器，创建一个目录（例如 `/root/warehouse`），然后将上述文件上传进去。

最终服务器上的目录结构应该如下所示：

```text
/root/warehouse/
├── dist/                <-- 前端静态文件
├── server/              <-- 后端代码
│   ├── dist/            <-- 后端编译文件
│   ├── package.json
│   ├── Dockerfile
│   ├── sql/             <-- 数据库初始化脚本
│   └── ...
├── docker-compose.yml
└── nginx.conf
```

> **注意**：请不要上传本地的 `node_modules` 文件夹，这会浪费大量时间且容易出错。服务器上会自动安装依赖。

## 3. 服务器端部署

登录服务器，进入你上传的目录：

```bash
cd /root/warehouse
```

### 3.1 启动服务

执行以下命令一键启动：

```bash
docker compose up -d --build
```

- `--build`: 强制构建后端镜像（会安装依赖）。
- `-d`: 后台运行。

### 3.2 验证部署

1.  **查看状态**：

    ```bash
    docker compose ps
    ```

    你应该能看到 `warehouse_frontend`, `warehouse_backend`, `warehouse_mysql` 三个容器都在运行 (`Up`)。

2.  **访问网站**：
    打开浏览器访问你的服务器 IP：`http://你的服务器IP/`。

## 4. 常见问题排查

- **数据库连接失败**：
  如果后端日志显示数据库连接错误，可能是 MySQL 还在初始化。请稍等几分钟，然后重启后端：

  ```bash
  docker compose restart backend
  ```

- **查看日志**：

  - 后端日志：`docker compose logs -f backend`
  - 前端(Nginx)日志：`docker compose logs -f frontend`
  - 数据库日志：`docker compose logs -f mysql`

- **端口被占用**：
  确保服务器的 80 (前端) 和 3001 (后端) 端口未被其他程序占用，且腾讯云安全组已放行 80 端口。
