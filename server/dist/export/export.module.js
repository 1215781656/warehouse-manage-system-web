"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const export_controller_1 = require("./export.controller");
const export_service_1 = require("./export.service");
const inbound_entity_1 = require("../inventory/inbound/inbound.entity");
const outbound_entity_1 = require("../inventory/outbound/outbound.entity");
const inventory_entity_1 = require("../inventory/stock/inventory.entity");
const color_fabric_entity_1 = require("../inventory/fabric/color-fabric.entity");
const receivable_entity_1 = require("../finance/receivable/receivable.entity");
const payable_entity_1 = require("../finance/payable/payable.entity");
let ExportModule = class ExportModule {
};
exports.ExportModule = ExportModule;
exports.ExportModule = ExportModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                inbound_entity_1.InboundOrder,
                outbound_entity_1.OutboundOrder,
                inventory_entity_1.Inventory,
                color_fabric_entity_1.ColorFabric,
                receivable_entity_1.Receivable,
                payable_entity_1.Payable,
            ]),
        ],
        controllers: [
            export_controller_1.ExportController,
            export_controller_1.ReportExportController,
            export_controller_1.ReportControllerAlias,
        ],
        providers: [export_service_1.ExportService],
        exports: [export_service_1.ExportService],
    })
], ExportModule);
//# sourceMappingURL=export.module.js.map