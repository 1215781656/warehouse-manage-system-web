"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfig = validateConfig;
function validateConfig(config) {
    if (config.DB_DISABLE === 'true') {
        throw new Error('DB_DISABLE is not allowed');
    }
    const required = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASS', 'DB_NAME'];
    for (const k of required) {
        if (!config[k])
            throw new Error(`Missing required env: ${k}`);
    }
    const port = Number(config.DB_PORT);
    if (!Number.isFinite(port) || port <= 0)
        throw new Error('Invalid DB_PORT');
    return {
        ...config,
        DB_PORT: port,
    };
}
//# sourceMappingURL=validate.js.map