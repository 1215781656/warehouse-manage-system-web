# 腾讯云服务器部署指南 (本地构建版)

本指南采用**本地构建 + 上传构建产物**的方式，避免服务器内存不足导致构建失败。

## 1. 准备工作 (本地操作)

### 1.1 本地构建

请在项目根目录下打开终端，依次执行以下命令：

```bash
# 1. 构建前端
# 已预置淘宝源镜像配置，安装更稳定更快速
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

---

## 5. 二次部署到其他服务器

- 将第 1 章的本地构建产物重新打包并上传到新的服务器（保持相同目录结构）。
- 调整 `docker-compose.yml` 中的数据库和后端环境变量（如 `DB_HOST`、`DB_USER`、`DB_PASS`、`JWT_SECRET`），确保与目标服务器匹配。
- 如需仅通过 80 端口访问附件预览/下载，建议在 `nginx.conf` 增加文件代理：

```nginx
location /files/ {
  proxy_pass http://backend:3001;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

- 前端附件预览需要正确设置文件基址。构建前，在前端根目录设置：
  - 开发环境：`.env` 中 `VITE_FILE_BASE=http://localhost:3001`
  - 生产构建：`.env.production` 中设置为你的后端地址，例如：`VITE_FILE_BASE=http://你的服务器IP:3001`
  - 也可按上文 Nginx 配置，将其设置为 `http://你的服务器IP`，并通过 `/files/` 代理到后端。

参考文件：

- 前端构建脚本：[package.json](file:///d:/privateCode/warehouse-manage-system-web/package.json)
- 前端文件基址配置： [.env](file:///d:/privateCode/warehouse-manage-system-web/.env) 、[.env.production](file:///d:/privateCode/warehouse-manage-system-web/.env.production)
- 后端 Dockerfile：[server/Dockerfile](file:///d:/privateCode/warehouse-manage-system-web/server/Dockerfile)
- Nginx 配置：[nginx.conf](file:///d:/privateCode/warehouse-manage-system-web/nginx.conf)
- 组合编排：[docker-compose.yml](file:///d:/privateCode/warehouse-manage-system-web/docker-compose.yml)

---

## 6. 更新与发布流程（零停机最小化）

- 前置建议：
  - 定期备份 `server/server_uploads`（容器挂载卷持久化目录）。
  - 保持 `.env`、`docker-compose.yml` 中的密钥与数据库配置准确一致。

### 6.1 本地重建

- 前端：
  ```bash
  yarn install
  yarn build
  ```
- 后端：
  ```bash
  cd server
  yarn install
  yarn build
  ```

### 6.2 上传更新

- 将新的 `dist/`（前端）与 `server/dist/`（后端）上传覆盖服务器对应目录。
- 不要上传 `node_modules`。

### 6.3 滚动重启

- 如仅更新前端静态资源：
  ```bash
  docker compose restart frontend
  ```
- 如更新后端：
  ```bash
  docker compose up -d --build backend
  ```
- 如同时更新前后端：
  ```bash
  docker compose up -d --build
  ```

### 6.4 验证

- 查看状态与日志：
  ```bash
  docker compose ps
  docker compose logs -f backend
  docker compose logs -f frontend
  ```
- 浏览器访问首页与核心页面，验证登录、入库/出库、附件上传与下载。

---

## 7. 实际问题与解决方案汇总

- 浏览器环境 `self.crypto.randomUUID` 不兼容导致线上报错：

  - 现象：线上打开“新增入库/新增出库”时出现 `TypeError: self.crypto.randomUUID is not a function`。
  - 解决：统一前端使用兼容函数 `generateUUID()`，已在以下文件修复：
    - 入库新增：[Add.vue](file:///d:/privateCode/warehouse-manage-system-web/src/views/inbound-management/components/Add.vue#L179-L214)
    - 出库新增：[Add.vue](file:///d:/privateCode/warehouse-manage-system-web/src/views/outbound-management/components/Add.vue#L253-L360)（通过 `cryptoRandom => generateUUID`）
    - 兼容函数来源：[src/helpers/index.ts](file:///d:/privateCode/warehouse-manage-system-web/src/helpers/index.ts#L106-L112)

- 附件预览/下载地址异常：

  - 现象：上传成功后，页面无法预览或下载税票/其他附件。
  - 原因：前端依赖 `VITE_FILE_BASE` 拼接后端文件服务路径 `/files/...`，生产未正确设置或未配置 Nginx 代理。
  - 解决：
    - 构建前设置 `VITE_FILE_BASE` 为后端可访问地址（如 `http://服务器IP:3001`），或在 Nginx 增加 `/files/` 代理后将其设为 `http://服务器IP`。
    - 相关代码参考：
      - 税票上传组件：[TaxInvoiceUpload.vue](file:///d:/privateCode/warehouse-manage-system-web/src/components/TaxInvoiceUpload.vue#L28-L39)
      - 其他附件上传组件：[GeneralFileUpload.vue](file:///d:/privateCode/warehouse-manage-system-web/src/components/GeneralFileUpload.vue#L132-L154)
      - 后端附件控制器（返回带 `FILE_BASE` 前缀的路径）：[attachments.controller.ts](file:///d:/privateCode/warehouse-manage-system-web/server/src/finance/attachments/attachments.controller.ts#L59-L73)

- 数据库初始化/认证插件问题：

  - 现象：后端无法登录数据库或初始化失败。
  - 解决：通过 `server/sql/mysql_setup.sql` 设置用户与认证插件为 `mysql_native_password` 并赋权。
    - 参考：[mysql_setup.sql](file:///d:/privateCode/warehouse-manage-system-web/server/sql/mysql_setup.sql)

- 环境变量不一致导致登录失败或 API 异常：
  - 确保后端 `JWT_SECRET`、数据库配置与前端 API 代理一致。
  - 参考：
    - 后端环境：[server/.env](file:///d:/privateCode/warehouse-manage-system-web/server/.env)
    - Nginx 代理： [nginx.conf](file:///d:/privateCode/warehouse-manage-system-web/nginx.conf)

---

## 8. 维护建议

- 使用 `docker compose` 的服务名进行互联，避免硬编码容器 IP。
- 定期清理旧镜像与无用卷：
  ```bash
  docker image prune -f
  docker volume prune -f
  ```
- 后端导出任务与附件上传涉及较长超时，已在 Nginx 中设置适当超时；如需更大文件，请在后端与 Nginx 同步调整。
- 所有包安装与构建统一使用 `yarn`。
