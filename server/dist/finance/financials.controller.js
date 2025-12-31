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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialsController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const receivable_entity_1 = require("./receivable/receivable.entity");
const payable_entity_1 = require("./payable/payable.entity");
const outbound_entity_1 = require("../inventory/outbound/outbound.entity");
const inbound_entity_1 = require("../inventory/inbound/inbound.entity");
const jwt_guard_1 = require("../auth/jwt.guard");
const swagger_1 = require("@nestjs/swagger");
let FinancialsController = class FinancialsController {
    constructor(recRepo, payRepo, outRepo, inRepo) {
        this.recRepo = recRepo;
        this.payRepo = payRepo;
        this.outRepo = outRepo;
        this.inRepo = inRepo;
    }
    async list() {
        const receivables = await this.recRepo.find({
            relations: ['outboundOrder'],
        });
        const payables = await this.payRepo.find({ relations: ['inboundOrder'] });
        return { receivables, payables };
    }
    async summary(startDate, endDate, customer) {
        const recQb = this.recRepo
            .createQueryBuilder('r')
            .leftJoin('r.outboundOrder', 'out')
            .where('r.deletedAt IS NULL');
        const payQb = this.payRepo
            .createQueryBuilder('p')
            .leftJoin('p.inboundOrder', 'in')
            .where('p.deletedAt IS NULL');
        if (customer) {
            recQb.andWhere('r.customer LIKE :c', { c: `%${customer}%` });
            payQb.andWhere('p.supplier LIKE :c', { c: `%${customer}%` });
        }
        if (startDate) {
            recQb.andWhere('out.outboundDate >= :sd', { sd: startDate });
            payQb.andWhere('in.inboundDate >= :sd', { sd: startDate });
        }
        if (endDate) {
            recQb.andWhere('out.outboundDate <= :ed', { ed: endDate });
            payQb.andWhere('in.inboundDate <= :ed', { ed: endDate });
        }
        const recSum = await recQb
            .select([
            'COALESCE(SUM(CAST(r.receivableAmount AS DECIMAL(20,2))),0) AS totalReceivable',
            'COALESCE(SUM(CAST(r.receivedAmount AS DECIMAL(20,2))),0) AS totalReceived',
            'COALESCE(SUM(CAST(r.unpaidAmount AS DECIMAL(20,2))),0) AS totalUnpaid',
            'COALESCE(SUM(CAST(r.taxInvoiceAmount AS DECIMAL(20,2))),0) AS taxInvoiceTotal',
        ])
            .getRawOne();
        const paySum = await payQb
            .select([
            'COALESCE(SUM(CAST(p.payableAmount AS DECIMAL(20,2))),0) AS totalPayable',
            'COALESCE(SUM(CAST(p.paidAmount AS DECIMAL(20,2))),0) AS totalPaid',
            'COALESCE(SUM(CAST(p.unpaidAmount AS DECIMAL(20,2))),0) AS totalUnpaid',
            'COALESCE(SUM(CAST(p.taxInvoiceAmount AS DECIMAL(20,2))),0) AS taxInvoiceTotal',
        ])
            .getRawOne();
        return {
            receivable: {
                totalReceivable: Number(Number(recSum?.totalReceivable || 0).toFixed(2)),
                totalReceived: Number(Number(recSum?.totalReceived || 0).toFixed(2)),
                totalUnpaid: Number(Number(recSum?.totalUnpaid || 0).toFixed(2)),
                taxInvoiceTotal: Number(Number(recSum?.taxInvoiceTotal || 0).toFixed(2)),
            },
            payable: {
                totalPayable: Number(Number(paySum?.totalPayable || 0).toFixed(2)),
                totalPaid: Number(Number(paySum?.totalPaid || 0).toFixed(2)),
                totalUnpaid: Number(Number(paySum?.totalUnpaid || 0).toFixed(2)),
                taxInvoiceTotal: Number(Number(paySum?.taxInvoiceTotal || 0).toFixed(2)),
            },
            updatedAt: new Date().toISOString(),
        };
    }
};
exports.FinancialsController = FinancialsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FinancialsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('customer')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], FinancialsController.prototype, "summary", null);
exports.FinancialsController = FinancialsController = __decorate([
    (0, swagger_1.ApiTags)('financials'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('financials'),
    __param(0, (0, typeorm_1.InjectRepository)(receivable_entity_1.Receivable)),
    __param(1, (0, typeorm_1.InjectRepository)(payable_entity_1.Payable)),
    __param(2, (0, typeorm_1.InjectRepository)(outbound_entity_1.OutboundOrder)),
    __param(3, (0, typeorm_1.InjectRepository)(inbound_entity_1.InboundOrder)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], FinancialsController);
//# sourceMappingURL=financials.controller.js.map