"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const typeorm_1 = require("typeorm");
const outbound_entity_1 = require("../inventory/outbound/outbound.entity");
const inbound_entity_1 = require("../inventory/inbound/inbound.entity");
const receivable_entity_1 = require("../finance/receivable/receivable.entity");
const payable_entity_1 = require("../finance/payable/payable.entity");
async function main() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, {
        logger: false,
    });
    try {
        const ds = app.get(typeorm_1.DataSource);
        const outRepo = ds.getRepository(outbound_entity_1.OutboundOrder);
        const inRepo = ds.getRepository(inbound_entity_1.InboundOrder);
        const recRepo = ds.getRepository(receivable_entity_1.Receivable);
        const payRepo = ds.getRepository(payable_entity_1.Payable);
        const outs = await outRepo.find({ relations: ['colorFabric'] });
        const ins = await inRepo.find({ relations: ['colorFabric'] });
        let createdRec = 0;
        let createdPay = 0;
        for (const o of outs) {
            const exists = await recRepo.findOne({ where: { outboundOrder: { id: o.id } } });
            if (!exists) {
                const amount = Number(o.amount || 0);
                await recRepo.save(recRepo.create({
                    outboundOrder: o,
                    customer: String(o.customer || ''),
                    receivableAmount: String(amount.toFixed(2)),
                    receivedAmount: String(0),
                    unpaidAmount: String(amount.toFixed(2)),
                    taxInvoiceAmount: String(0),
                    source: 'outbound',
                    sourceId: String(o.id),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }));
                createdRec++;
            }
        }
        for (const i of ins) {
            const exists = await payRepo.findOne({ where: { inboundOrder: { id: i.id } } });
            if (!exists) {
                const amount = Number(i.amount || 0);
                await payRepo.save(payRepo.create({
                    inboundOrder: i,
                    supplier: String(i.supplier || ''),
                    payableAmount: String(amount.toFixed(2)),
                    paidAmount: String(0),
                    unpaidAmount: String(amount.toFixed(2)),
                    taxInvoiceAmount: String(0),
                    source: 'inbound',
                    sourceId: String(i.id),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }));
                createdPay++;
            }
        }
        console.log(`[backfill-finance] receivable created: ${createdRec}, payable created: ${createdPay}`);
    }
    catch (e) {
        console.error('[backfill-finance] failed', e);
        process.exitCode = 1;
    }
    finally {
        await app.close();
    }
}
main();
//# sourceMappingURL=backfill-finance.js.map