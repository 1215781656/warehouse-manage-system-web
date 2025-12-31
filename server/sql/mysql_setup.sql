-- 创建数据库（若不存在）
CREATE DATABASE IF NOT EXISTS `fabric_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 创建应用用户（如已存在可跳过或修改密码）
CREATE USER IF NOT EXISTS 'fabric_app'@'%' IDENTIFIED WITH mysql_native_password BY '123456';

-- 将认证插件调整为推荐的方式（二选一）
-- 方案A：mysql_native_password（兼容性最好）
ALTER USER 'fabric_app'@'%' IDENTIFIED WITH mysql_native_password BY '123456';
-- 方案B：caching_sha2_password（MySQL8默认，更安全，需确保驱动支持）
-- ALTER USER 'fabric_app'@'%' IDENTIFIED WITH caching_sha2_password BY '123456';

-- 赋予数据库权限
GRANT ALL PRIVILEGES ON `fabric_db`.* TO 'fabric_app'@'%';
FLUSH PRIVILEGES;

-- 检查默认认证插件
SHOW VARIABLES LIKE 'default_authentication_plugin';

-- 检查用户的认证插件
SELECT user, host, plugin FROM mysql.user WHERE user = 'fabric_app';

