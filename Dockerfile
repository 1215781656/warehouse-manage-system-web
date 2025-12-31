# 纯静态部署模式
FROM nginx:stable-alpine

# 直接复制本地构建好的 dist 目录
COPY dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
