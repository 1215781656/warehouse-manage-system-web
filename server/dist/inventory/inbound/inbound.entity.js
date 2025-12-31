"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InboundOrder = void 0;
const typeorm_1 = require("typeorm");
const color_fabric_entity_1 = require("../fabric/color-fabric.entity");
const inbound_batch_entity_1 = require("./inbound-batch.entity");
let InboundOrder = class InboundOrder {
};
exports.InboundOrder = InboundOrder;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InboundOrder.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => color_fabric_entity_1.ColorFabric),
    (0, typeorm_1.JoinColumn)({ name: 'color_fabric_id' }),
    __metadata("design:type", color_fabric_entity_1.ColorFabric)
], InboundOrder.prototype, "colorFabric", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => inbound_batch_entity_1.InboundBatch),
    (0, typeorm_1.JoinColumn)({ name: 'inbound_batch_id' }),
    __metadata("design:type", inbound_batch_entity_1.InboundBatch)
], InboundOrder.prototype, "batch", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InboundOrder.prototype, "inboundNo", void 0);
__decorate([
    (0, typeorm_1.Column)('date'),
    __metadata("design:type", String)
], InboundOrder.prototype, "inboundDate", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InboundOrder.prototype, "supplier", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], InboundOrder.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2 }),
    __metadata("design:type", String)
], InboundOrder.prototype, "weightKg", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2 }),
    __metadata("design:type", String)
], InboundOrder.prototype, "unitPrice", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2 }),
    __metadata("design:type", String)
], InboundOrder.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InboundOrder.prototype, "operator", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], InboundOrder.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'datetime',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], InboundOrder.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], InboundOrder.prototype, "deletedAt", void 0);
exports.InboundOrder = InboundOrder = __decorate([
    (0, typeorm_1.Entity)('inbound_order')
], InboundOrder);
//# sourceMappingURL=inbound.entity.js.map