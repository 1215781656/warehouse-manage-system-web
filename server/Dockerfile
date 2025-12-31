FROM node:18-alpine

WORKDIR /app

# Copy package.json
COPY package.json ./
COPY yarn.lock ./

# Set Taobao mirror for faster installs
ARG TAOBAO_REGISTRY=https://registry.npmmirror.com
ENV npm_config_registry=${TAOBAO_REGISTRY}
ENV YARN_REGISTRY=${TAOBAO_REGISTRY}
ENV YARN_NPM_REGISTRY_SERVER=${TAOBAO_REGISTRY}
RUN yarn config set registry ${TAOBAO_REGISTRY} && yarn config set network-timeout 600000
ENV npm_config_disturl=https://npmmirror.com/mirrors/node
RUN apk add --no-cache python3 make g++ && npm config set python /usr/bin/python3 && export PYTHON=/usr/bin/python3

# Install production dependencies
# Note: We use --ignore-scripts to avoid potential issues with pre/post install scripts in some environments, 
# but remove it if you have necessary scripts.
RUN yarn install --production --frozen-lockfile || yarn install --production

# Copy built application
COPY dist ./dist

# Copy .env file if it exists (Optional here, but better mounted or env_file in compose)
# We will rely on docker-compose to inject env vars or mount the file.

# Create directory for uploads if it doesn't exist
RUN mkdir -p server_uploads

EXPOSE 3001

CMD ["node", "dist/main"]
