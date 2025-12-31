"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyDatabaseConnectionWithRetry = verifyDatabaseConnectionWithRetry;
async function verifyDatabaseConnectionWithRetry(dataSource, retries = 3, delayMs = 2000) {
    let lastErr;
    for (let i = 0; i < retries; i++) {
        try {
            await dataSource.query('SELECT 1');
            return;
        }
        catch (err) {
            lastErr = err;
            await new Promise((r) => setTimeout(r, delayMs));
        }
    }
    throw lastErr;
}
//# sourceMappingURL=db-check.js.map