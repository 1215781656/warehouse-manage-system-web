"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const color_fabric_entity_1 = require("./fabric/color-fabric.entity");
const inbound_entity_1 = require("./inbound/inbound.entity");
const outbound_entity_1 = require("./outbound/outbound.entity");
const inventory_entity_1 = require("./stock/inventory.entity");
const inbound_controller_1 = require("./inbound/inbound.controller");
const outbound_controller_1 = require("./outbound/outbound.controller");
const stock_controller_1 = require("./stock/stock.controller");
const color_fabric_controller_1 = require("./fabric/color-fabric.controller");
const operation_log_entity_1 = require("../system/operation-log.entity");
const inventory_controller_1 = require("./inventory.controller");
const transactions_controller_1 = require("./transactions.controller");
const inbound_batch_entity_1 = require("./inbound/inbound-batch.entity");
const receivable_entity_1 = require("../finance/receivable/receivable.entity");
const payable_entity_1 = require("../finance/payable/payable.entity");
const tax_invoice_attachment_entity_1 = require("../finance/attachments/tax-invoice-attachment.entity");
let InventoryModule = class InventoryModule {
};
exports.InventoryModule = InventoryModule;
exports.InventoryModule = InventoryModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                color_fabric_entity_1.ColorFabric,
                inbound_entity_1.InboundOrder,
                outbound_entity_1.OutboundOrder,
                inventory_entity_1.Inventory,
                operation_log_entity_1.OperationLog,
                inbound_batch_entity_1.InboundBatch,
                receivable_entity_1.Receivable,
                payable_entity_1.Payable,
                tax_invoice_attachment_entity_1.TaxInvoiceAttachment,
            ]),
        ],
        controllers: [
            inbound_controller_1.InboundController,
            outbound_controller_1.OutboundController,
            stock_controller_1.StockController,
            color_fabric_controller_1.ColorFabricController,
            inventory_controller_1.InventoryController,
            transactions_controller_1.TransactionsController,
        ],
    })
], InventoryModule);
//# sourceMappingURL=inventory.module.js.map