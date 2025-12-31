# 构建阶段
FROM node:18-alpine

WORKDIR /app

# 设置 yarn 镜像源
RUN yarn config set registry https://registry.npmmirror.com/

# 复制依赖文件
COPY package.json yarn.lock ./

# 安装依赖
RUN yarn install

# 复制源代码
COPY . .

# 构建 NestJS 项目
RUN yarn build

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["yarn", "start:prod"]
