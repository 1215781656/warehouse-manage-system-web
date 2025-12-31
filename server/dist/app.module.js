"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const validate_1 = require("./config/validate");
const user_entity_1 = require("./users/user.entity");
const permission_entity_1 = require("./users/permission.entity");
const auth_module_1 = require("./auth/auth.module");
const inbound_entity_1 = require("./inventory/inbound/inbound.entity");
const outbound_entity_1 = require("./inventory/outbound/outbound.entity");
const inventory_entity_1 = require("./inventory/stock/inventory.entity");
const receivable_entity_1 = require("./finance/receivable/receivable.entity");
const payable_entity_1 = require("./finance/payable/payable.entity");
const color_fabric_entity_1 = require("./inventory/fabric/color-fabric.entity");
const inventory_module_1 = require("./inventory/inventory.module");
const finance_module_1 = require("./finance/finance.module");
const users_module_1 = require("./users/users.module");
const operation_log_entity_1 = require("./system/operation-log.entity");
const inbound_batch_entity_1 = require("./inventory/inbound/inbound-batch.entity");
const export_module_1 = require("./export/export.module");
const tax_invoice_attachment_entity_1 = require("./finance/attachments/tax-invoice-attachment.entity");
const other_attachment_entity_1 = require("./finance/attachments/other-attachment.entity");
const schedule_1 = require("@nestjs/schedule");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, validate: validate_1.validateConfig }),
            schedule_1.ScheduleModule.forRoot(),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'mysql',
                host: process.env.DB_HOST,
                port: Number(process.env.DB_PORT),
                username: process.env.DB_USER,
                password: process.env.DB_PASS,
                database: process.env.DB_NAME,
                charset: 'utf8mb4',
                entities: [
                    user_entity_1.User,
                    permission_entity_1.Permission,
                    color_fabric_entity_1.ColorFabric,
                    inbound_entity_1.InboundOrder,
                    inbound_batch_entity_1.InboundBatch,
                    outbound_entity_1.OutboundOrder,
                    inventory_entity_1.Inventory,
                    receivable_entity_1.Receivable,
                    payable_entity_1.Payable,
                    operation_log_entity_1.OperationLog,
                    tax_invoice_attachment_entity_1.TaxInvoiceAttachment,
                    other_attachment_entity_1.OtherAttachment,
                ],
                synchronize: true,
                connectTimeout: 10000,
                extra: {
                    connectionLimit: 10,
                    waitForConnections: true,
                    queueLimit: 0,
                    allowPublicKeyRetrieval: true,
                },
            }),
            auth_module_1.AuthModule,
            inventory_module_1.InventoryModule,
            finance_module_1.FinanceModule,
            users_module_1.UsersModule,
            export_module_1.ExportModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map