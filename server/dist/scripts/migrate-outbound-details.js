"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const typeorm_1 = require("typeorm");
const outbound_entity_1 = require("../inventory/outbound/outbound.entity");
async function main() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, {
        logger: false,
    });
    try {
        const ds = app.get(typeorm_1.DataSource);
        const repo = ds.getRepository(outbound_entity_1.OutboundOrder);
        const rows = await repo.find();
        let migrated = 0;
        for (const r of rows) {
            const hasOutbound = Array.isArray(r.outboundDetails) && r.outboundDetails.length > 0;
            const weightArrRaw = Array.isArray(r.weightDetails) ? r.weightDetails : [];
            const weightArr = weightArrRaw.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0);
            if (!hasOutbound && weightArr.length > 0) {
                const qty = weightArr.length;
                const weight = weightArr.reduce((a, b) => a + b, 0);
                await repo.update({ id: r.id }, {
                    outboundDetails: weightArr,
                    quantity: qty,
                    weightKg: weight.toFixed(2),
                    weightDetails: null,
                });
                migrated++;
            }
        }
        console.log(`[migrate-outbound-details] migrated ${migrated} rows`);
    }
    catch (e) {
        console.error('[migrate-outbound-details] failed', e);
        process.exitCode = 1;
    }
    finally {
        await app.close();
    }
}
main();
//# sourceMappingURL=migrate-outbound-details.js.map