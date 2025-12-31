FROM nginx:stable-alpine

# 安装必要的工具
RUN apk add --no-cache curl

# 复制构建产物
COPY dist /usr/share/nginx/html

# 复制Nginx配置文件
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]