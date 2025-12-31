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
exports.Payable = void 0;
const typeorm_1 = require("typeorm");
const inbound_entity_1 = require("../../inventory/inbound/inbound.entity");
let Payable = class Payable {
};
exports.Payable = Payable;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Payable.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => inbound_entity_1.InboundOrder),
    (0, typeorm_1.JoinColumn)({ name: 'inbound_order_id' }),
    __metadata("design:type", inbound_entity_1.InboundOrder)
], Payable.prototype, "inboundOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", String)
], Payable.prototype, "inboundDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Payable.prototype, "inboundNo", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Payable.prototype, "supplier", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Payable.prototype, "productSpec", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Payable.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Payable.prototype, "composition", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Payable.prototype, "color", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Payable.prototype, "craft", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fabric_weight', nullable: true }),
    __metadata("design:type", String)
], Payable.prototype, "fabricWeight", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'customer_remark', nullable: true }),
    __metadata("design:type", String)
], Payable.prototype, "customerRemark", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { name: 'piece_count', nullable: true }),
    __metadata("design:type", Number)
], Payable.prototype, "pieceCount", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { name: 'total_weight', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", String)
], Payable.prototype, "totalWeight", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { name: 'unit_price', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", String)
], Payable.prototype, "unitPrice", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2 }),
    __metadata("design:type", String)
], Payable.prototype, "payableAmount", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", String)
], Payable.prototype, "paidAmount", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2 }),
    __metadata("design:type", String)
], Payable.prototype, "unpaidAmount", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", String)
], Payable.prototype, "taxInvoiceAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Payable.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Payable.prototype, "sourceId", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], Payable.prototype, "remark", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Payable.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Payable.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Payable.prototype, "updatedAt", void 0);
exports.Payable = Payable = __decorate([
    (0, typeorm_1.Entity)('payable')
], Payable);
//# sourceMappingURL=payable.entity.js.map