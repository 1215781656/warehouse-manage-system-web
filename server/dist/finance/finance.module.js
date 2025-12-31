"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const receivable_entity_1 = require("./receivable/receivable.entity");
const payable_entity_1 = require("./payable/payable.entity");
const outbound_entity_1 = require("../inventory/outbound/outbound.entity");
const inbound_entity_1 = require("../inventory/inbound/inbound.entity");
const receivable_controller_1 = require("./receivable/receivable.controller");
const payable_controller_1 = require("./payable/payable.controller");
const financials_controller_1 = require("./financials.controller");
const tax_invoice_attachment_entity_1 = require("./attachments/tax-invoice-attachment.entity");
const other_attachment_entity_1 = require("./attachments/other-attachment.entity");
const attachments_controller_1 = require("./attachments/attachments.controller");
const attachments_service_1 = require("./attachments/attachments.service");
const cleanup_service_1 = require("./attachments/cleanup.service");
const operation_log_entity_1 = require("../system/operation-log.entity");
let FinanceModule = class FinanceModule {
};
exports.FinanceModule = FinanceModule;
exports.FinanceModule = FinanceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                receivable_entity_1.Receivable,
                payable_entity_1.Payable,
                outbound_entity_1.OutboundOrder,
                inbound_entity_1.InboundOrder,
                tax_invoice_attachment_entity_1.TaxInvoiceAttachment,
                other_attachment_entity_1.OtherAttachment,
                operation_log_entity_1.OperationLog,
            ]),
        ],
        controllers: [
            receivable_controller_1.ReceivableController,
            payable_controller_1.PayableController,
            financials_controller_1.FinancialsController,
            attachments_controller_1.AttachmentsController,
        ],
        providers: [attachments_service_1.AttachmentsService, cleanup_service_1.AttachmentsCleanupService],
    })
], FinanceModule);
//# sourceMappingURL=finance.module.js.map