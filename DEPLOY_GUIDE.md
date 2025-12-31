# 色布出入库管理系统 - 容器化部署指南

本文档用于指导将本项目部署到腾讯云或其他 Linux 服务器。方案采用 Docker + Docker Compose 全栈容器化部署。

## 1. 准备工作

### 1.1 服务器环境准备

登录到您的云服务器（SSH），执行以下命令安装 Docker 和 Docker Compose。

```bash
# 1. 更新系统软件包
sudo apt-get update || sudo yum update -y

# 2. 安装 Docker (使用官方脚本，适用于 Ubuntu/CentOS/Debian)
curl -fsSL https://get.docker.com | bash

# 3. 启动 Docker 并设置开机自启
sudo systemctl start docker
sudo systemctl enable docker

# 4. 安装 Docker Compose (新版 Docker 已集成 docker compose 命令，若无则需单独安装)
# 验证安装
docker compose version
# 如果显示 'docker: 'compose' is not a docker command'，则安装独立版：
# sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
# sudo chmod +x /usr/local/bin/docker-compose
```

### 1.2 防火墙设置

在腾讯云控制台 -> 安全组中，确保开放以下端口：

- **80**: 前端访问端口（HTTP）
- **22**: SSH 远程连接（默认已开）

---

## 2. 部署步骤

### 2.1 上传代码

将本地项目代码上传至服务器。

**注意：不需要上传 `node_modules` 和 `dist` 目录！**
Docker 会在构建镜像的过程中自动安装依赖并进行构建。

**推荐上传内容：**

- `server/` (后端代码，但不含 server/node_modules)
- `src/` (前端源码)
- `public/`
- `package.json`, `yarn.lock`, `vite.config.ts` 等根目录配置文件
- `Dockerfile`, `docker-compose.yml`, `nginx.conf` (刚刚生成的部署文件)

**上传方式建议：**

1.  **使用 Git (推荐)**：在本地提交代码（确保 `.gitignore` 忽略了 node_modules），然后在服务器 `git clone`。
2.  **使用 SCP/SFTP**：如果直接上传文件夹，请手动排除 node_modules。

```bash
# 假设代码上传到了 /opt/warehouse-manage-system-web 目录
cd /opt/warehouse-manage-system-web
```

### 2.2 环境变量配置 (可选)

项目根目录下的 `docker-compose.yml` 中已经配置了默认的环境变量（如数据库密码）。
**如果是生产环境**，建议修改 `MYSQL_ROOT_PASSWORD` 和后端的数据库连接密码。

### 2.3 启动服务

在项目根目录下执行一键启动命令：

```bash
# 构建镜像并后台启动
# Docker 会读取 Dockerfile，自动在容器内执行 yarn install 和 yarn build
docker compose up -d --build
```

### 2.4 查看状态

```bash
# 查看容器运行状态
docker compose ps

# 查看日志 (排查问题用)
docker compose logs -f
```

---

## 3. 验证部署

打开浏览器访问服务器 IP：`http://<您的服务器IP>`

- 如果看到登录页面，说明前端 Nginx 正常。
- 尝试登录（默认账号 admin / 密码 admin123，具体视数据库初始化脚本而定），如果成功，说明后端和数据库连接正常。

---

## 4. 后续维护

### 更新代码后重新部署

```bash
# 1. 拉取最新代码
git pull

# 2. 重建并重启容器 (只会重建有变动的部分)
docker compose up -d --build
```

### 停止服务

```bash
docker compose down
```

---

## 5. AI 提示词 (Prompt)

如果您后续需要部署到新的生产环境，且环境配置（如域名、端口、数据库密码）发生变化，可以使用以下提示词让 AI 帮您快速生成新的配置文件。

**复制以下内容发送给 AI：**

> 我需要将当前项目部署到**生产环境**。
> 请帮我重新生成 `docker-compose.yml` 和 `nginx.conf` 文件。
>
> **环境要求如下：**
>
> 1.  **域名**：配置 Nginx 使用域名 `your-domain.com`（如果有）。
> 2.  **端口**：前端对外暴露端口为 `80`。
> 3.  **数据库**：
>     - Root 密码请设置为：`NEW_STRONG_PASSWORD`
>     - 数据库名称保持 `warehouse_db`
> 4.  **后端配置**：
>     - JWT 密钥请生成一个新的强随机字符串。
>     - 数据库连接配置需与上述数据库设置保持一致。
>
> 请直接提供修改后的文件内容，并告知我需要注意的安全事项。
