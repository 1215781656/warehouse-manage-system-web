# 构建阶段
FROM node:18-alpine as build-stage

WORKDIR /app

# 设置 yarn 镜像源
RUN yarn config set registry https://registry.npmmirror.com/

# 复制依赖文件
COPY package.json yarn.lock ./

# 安装依赖
RUN yarn install

# 复制源代码
COPY . .

# 构建生产环境代码
RUN yarn build-only

# 生产运行阶段
FROM nginx:stable-alpine as production-stage

# 复制构建产物到 Nginx 目录
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露 80 端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
