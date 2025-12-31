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
exports.ReceivableController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const date_range_1 = require("../../utils/date-range");
const receivable_entity_1 = require("./receivable.entity");
const jwt_guard_1 = require("../../auth/jwt.guard");
const swagger_1 = require("@nestjs/swagger");
const attachments_service_1 = require("../attachments/attachments.service");
let ReceivableController = class ReceivableController {
    constructor(repo, attachments) {
        this.repo = repo;
        this.attachments = attachments;
    }
    async list(page, pageSize, customer, startDate, endDate) {
        const p = Math.max(1, Number(page || 1));
        const ps = Math.max(1, Math.min(200, Number(pageSize || 10)));
        const qb = this.repo
            .createQueryBuilder('r')
            .leftJoinAndSelect('r.outboundOrder', 'out')
            .leftJoinAndSelect('out.colorFabric', 'cf')
            .where('r.deletedAt IS NULL');
        if (customer)
            qb.andWhere('r.customer LIKE :c', { c: `%${customer}%` });
        if (startDate || endDate) {
            const { start, end } = (0, date_range_1.clipToDate)(startDate, endDate);
            if (start)
                qb.andWhere('out.outboundDate >= :sd', { sd: start });
            if (end)
                qb.andWhere('out.outboundDate <= :ed', { ed: end });
        }
        const total = await qb.getCount();
        const rows = await qb
            .orderBy('out.outboundDate', 'DESC')
            .skip((p - 1) * ps)
            .take(ps)
            .getMany();
        const list = rows.map((r) => {
            const out = r.outboundOrder || {};
            const cf = out.colorFabric || {};
            const outboundDateStr = String(out.outboundDate || r.outboundDate || '').substring(0, 10);
            const receivableAmount = Number(((r.receivableAmount
                ? Number(r.receivableAmount)
                : Number(out.amount || 0)) || 0).toFixed(2));
            const receivedAmount = Number(Number(r.receivedAmount || 0).toFixed(2));
            const unpaidAmount = Number((r.unpaidAmount !== undefined && r.unpaidAmount !== null
                ? Number(r.unpaidAmount)
                : receivableAmount - receivedAmount).toFixed(2));
            return {
                id: r.id,
                outboundDate: outboundDateStr,
                outboundNo: out.outboundNo || r.outboundNo,
                deliveryNo: out.deliveryNo || r.deliveryNo,
                customer: r.customer || out.customer,
                code: r.code || out.code || '',
                productSpec: r.productSpec || cf.productSpec || '',
                composition: r.composition || out.composition || cf.composition || '',
                color: r.color || out.color || cf.color || '',
                craft: r.craft || out.process || '',
                fabricWeight: r.fabricWeight || out.gramWeight || cf.weight || '',
                customerRemark: r.customerRemark || out.customerNote || '',
                pieceCount: r.pieceCount !== null ? r.pieceCount : out.quantity || 0,
                totalWeight: Number(r.totalWeight !== null ? r.totalWeight : out.weightKg || 0),
                unitPrice: Number(r.unitPrice !== null ? r.unitPrice : out.unitPrice || 0),
                quantity: Number(out.quantity || 0),
                weightKg: Number(out.weightKg || 0),
                receivableAmount,
                receivedAmount,
                unpaidAmount,
                taxInvoiceAmount: Number(Number(r.taxInvoiceAmount || 0).toFixed(2)),
                source: r.source,
                deletedAt: r.deletedAt,
                remark: r.remark,
            };
        });
        const sumQb = this.repo
            .createQueryBuilder('r')
            .leftJoin('r.outboundOrder', 'out')
            .where('r.deletedAt IS NULL');
        if (customer)
            sumQb.andWhere('r.customer LIKE :c', { c: `%${customer}%` });
        if (startDate || endDate) {
            const { start, end } = (0, date_range_1.clipToDate)(startDate, endDate);
            if (start)
                sumQb.andWhere('out.outboundDate >= :sd', { sd: start });
            if (end)
                sumQb.andWhere('out.outboundDate <= :ed', { ed: end });
        }
        const sumRaw = await sumQb
            .select([
            'COALESCE(SUM(CAST(r.receivableAmount AS DECIMAL(20,2))),0) AS totalReceivable',
            'COALESCE(SUM(CAST(r.receivedAmount AS DECIMAL(20,2))),0) AS totalReceived',
            'COALESCE(SUM(CAST(r.unpaidAmount AS DECIMAL(20,2))),0) AS totalUnpaid',
            'COALESCE(SUM(CAST(r.taxInvoiceAmount AS DECIMAL(20,2))),0) AS taxInvoiceTotal',
        ])
            .getRawOne();
        const globalSumRaw = await this.repo
            .createQueryBuilder('r')
            .leftJoin('r.outboundOrder', 'out')
            .where('r.deletedAt IS NULL')
            .select([
            'COALESCE(SUM(CAST(r.receivableAmount AS DECIMAL(20,2))),0) AS totalReceivable',
            'COALESCE(SUM(CAST(r.receivedAmount AS DECIMAL(20,2))),0) AS totalReceived',
            'COALESCE(SUM(CAST(r.unpaidAmount AS DECIMAL(20,2))),0) AS totalUnpaid',
            'COALESCE(SUM(CAST(r.taxInvoiceAmount AS DECIMAL(20,2))),0) AS taxInvoiceTotal',
        ])
            .getRawOne();
        const summary = {
            receivable: {
                totalReceivable: Number(Number(sumRaw?.totalReceivable || 0).toFixed(2)),
                totalReceived: Number(Number(sumRaw?.totalReceived || 0).toFixed(2)),
                totalUnpaid: Number(Number(sumRaw?.totalUnpaid || 0).toFixed(2)),
                taxInvoiceTotal: Number(Number(sumRaw?.taxInvoiceTotal || 0).toFixed(2)),
            },
        };
        const globalSummary = {
            receivable: {
                totalReceivable: Number(Number(globalSumRaw?.totalReceivable || 0).toFixed(2)),
                totalReceived: Number(Number(globalSumRaw?.totalReceived || 0).toFixed(2)),
                totalUnpaid: Number(Number(globalSumRaw?.totalUnpaid || 0).toFixed(2)),
                taxInvoiceTotal: Number(Number(globalSumRaw?.taxInvoiceTotal || 0).toFixed(2)),
            },
        };
        return {
            list,
            total,
            page: p,
            pageSize: ps,
            pages: Math.ceil(total / ps),
            summary,
            globalSummary,
            updatedAt: new Date().toISOString(),
        };
    }
    async create(dto) {
        const entity = this.repo.create({
            outboundOrder: dto.outboundOrder,
            outboundDate: String(dto.outboundDate || '').substring(0, 10) || null,
            outboundNo: String(dto.outboundNo || '') || null,
            deliveryNo: String(dto.deliveryNo || '') || null,
            customer: String(dto.customer || ''),
            code: dto.code,
            productSpec: String(dto.productSpec || '') || null,
            composition: dto.composition,
            color: dto.color,
            craft: dto.craft,
            fabricWeight: dto.fabricWeight,
            customerRemark: dto.customerRemark,
            pieceCount: dto.pieceCount,
            totalWeight: dto.totalWeight,
            unitPrice: dto.unitPrice,
            receivableAmount: String(dto.receivableAmount || '0'),
            receivedAmount: String(dto.receivedAmount || '0'),
            unpaidAmount: String((Number(dto.receivableAmount || 0) - Number(dto.receivedAmount || 0)).toFixed(2)),
            taxInvoiceAmount: String(dto.taxInvoiceAmount || '0'),
            source: String(dto.source || 'manual'),
            sourceId: String(dto.sourceId || ''),
            remark: String(dto.remark || ''),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        const saved = await this.repo.save(entity);
        return saved;
    }
    async detail(id) {
        const r = await this.repo.findOne({
            where: { id },
            relations: ['outboundOrder', 'outboundOrder.colorFabric'],
        });
        if (!r)
            return null;
        const out = r.outboundOrder || {};
        const cf = out.colorFabric || {};
        const taxAttachments = await this.attachments.listTaxByRef(id);
        const otherAttachments = await this.attachments.listOtherByRef(id);
        const base = process.env.FILE_BASE || '';
        const mapPath = (p) => (base ? `${base}${p}` : p);
        return {
            id: r.id,
            outboundDate: String(out.outboundDate || r.outboundDate || '').substring(0, 10),
            outboundNo: out.outboundNo || r.outboundNo,
            customer: r.customer || out.customer,
            code: r.deliveryNo || r.code || out.deliveryNo || out.code || '',
            deliveryNo: r.deliveryNo || r.code || out.deliveryNo || '',
            productSpec: r.productSpec || cf.productSpec || '',
            composition: r.composition || out.composition || cf.composition || '',
            color: r.color || out.color || cf.color || '',
            craft: r.craft || out.process || '',
            fabricWeight: r.fabricWeight || out.gramWeight || cf.weight || '',
            customerRemark: r.customerRemark || out.customerNote || '',
            pieceCount: r.pieceCount !== null ? r.pieceCount : out.quantity || 0,
            totalWeight: Number(r.totalWeight !== null ? r.totalWeight : out.weightKg || 0),
            unitPrice: Number(r.unitPrice !== null ? r.unitPrice : out.unitPrice || 0),
            receivableAmount: Number(r.receivableAmount || 0),
            receivedAmount: Number(r.receivedAmount || 0),
            unpaidAmount: Number(r.unpaidAmount || 0),
            taxInvoiceAmount: Number(r.taxInvoiceAmount || 0),
            remark: r.remark,
            taxAttachments: taxAttachments.map((x) => ({
                ...x,
                path: mapPath(x.path),
            })),
            otherAttachments: otherAttachments.map((x) => ({
                ...x,
                path: mapPath(x.path),
            })),
        };
    }
    async update(id, dto) {
        const patch = {};
        [
            'customer',
            'receivableAmount',
            'receivedAmount',
            'taxInvoiceAmount',
            'source',
            'sourceId',
            'remark',
            'outboundNo',
            'deliveryNo',
            'productSpec',
            'code',
            'composition',
            'color',
            'craft',
            'fabricWeight',
            'customerRemark',
            'pieceCount',
            'totalWeight',
            'unitPrice',
        ].forEach((k) => {
            const v = dto[k];
            if (v !== undefined)
                patch[k] = v;
        });
        if (dto.outboundDate !== undefined) {
            patch.outboundDate = String(dto.outboundDate || '').substring(0, 10);
        }
        if (dto.deletedAt !== undefined)
            patch.deletedAt = new Date(String(dto.deletedAt));
        if (dto.receivableAmount !== undefined ||
            dto.receivedAmount !== undefined) {
            const existing = await this.repo.findOne({ where: { id } });
            const rec = dto.receivableAmount !== undefined
                ? Number(dto.receivableAmount)
                : Number(existing?.receivableAmount || 0);
            const got = dto.receivedAmount !== undefined
                ? Number(dto.receivedAmount)
                : Number(existing?.receivedAmount || 0);
            patch.unpaidAmount = String((rec - got).toFixed(2));
        }
        patch.updatedAt = new Date();
        await this.repo.update({ id }, patch);
        return await this.repo.findOne({
            where: { id },
            relations: ['outboundOrder'],
        });
    }
};
exports.ReceivableController = ReceivableController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('customer')),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReceivableController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReceivableController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReceivableController.prototype, "detail", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReceivableController.prototype, "update", null);
exports.ReceivableController = ReceivableController = __decorate([
    (0, swagger_1.ApiTags)('finance-receivable'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('finance/receivable'),
    __param(0, (0, typeorm_1.InjectRepository)(receivable_entity_1.Receivable)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        attachments_service_1.AttachmentsService])
], ReceivableController);
//# sourceMappingURL=receivable.controller.js.map