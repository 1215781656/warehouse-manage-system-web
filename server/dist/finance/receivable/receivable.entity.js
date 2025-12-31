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
exports.Receivable = void 0;
const typeorm_1 = require("typeorm");
const outbound_entity_1 = require("../../inventory/outbound/outbound.entity");
let Receivable = class Receivable {
};
exports.Receivable = Receivable;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Receivable.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => outbound_entity_1.OutboundOrder),
    (0, typeorm_1.JoinColumn)({ name: 'outbound_order_id' }),
    __metadata("design:type", outbound_entity_1.OutboundOrder)
], Receivable.prototype, "outboundOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", String)
], Receivable.prototype, "outboundDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Receivable.prototype, "outboundNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Receivable.prototype, "deliveryNo", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Receivable.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Receivable.prototype, "productSpec", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Receivable.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Receivable.prototype, "composition", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Receivable.prototype, "color", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Receivable.prototype, "craft", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fabric_weight', nullable: true }),
    __metadata("design:type", String)
], Receivable.prototype, "fabricWeight", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'customer_remark', nullable: true }),
    __metadata("design:type", String)
], Receivable.prototype, "customerRemark", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { name: 'piece_count', nullable: true }),
    __metadata("design:type", Number)
], Receivable.prototype, "pieceCount", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { name: 'total_weight', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", String)
], Receivable.prototype, "totalWeight", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { name: 'unit_price', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", String)
], Receivable.prototype, "unitPrice", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2 }),
    __metadata("design:type", String)
], Receivable.prototype, "receivableAmount", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", String)
], Receivable.prototype, "receivedAmount", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2 }),
    __metadata("design:type", String)
], Receivable.prototype, "unpaidAmount", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", String)
], Receivable.prototype, "taxInvoiceAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Receivable.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Receivable.prototype, "sourceId", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], Receivable.prototype, "remark", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Receivable.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Receivable.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Receivable.prototype, "updatedAt", void 0);
exports.Receivable = Receivable = __decorate([
    (0, typeorm_1.Entity)('receivable')
], Receivable);
//# sourceMappingURL=receivable.entity.js.map