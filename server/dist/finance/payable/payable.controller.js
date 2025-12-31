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
exports.PayableController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const date_range_1 = require("../../utils/date-range");
const payable_entity_1 = require("./payable.entity");
const jwt_guard_1 = require("../../auth/jwt.guard");
const swagger_1 = require("@nestjs/swagger");
const attachments_service_1 = require("../attachments/attachments.service");
let PayableController = class PayableController {
    constructor(repo, attachments) {
        this.repo = repo;
        this.attachments = attachments;
    }
    async list(page, pageSize, customer, startDate, endDate) {
        const p = Math.max(1, Number(page || 1));
        const ps = Math.max(1, Math.min(200, Number(pageSize || 10)));
        const qb = this.repo
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.inboundOrder', 'in')
            .leftJoinAndSelect('in.colorFabric', 'cf')
            .where('p.deletedAt IS NULL');
        if (customer)
            qb.andWhere('p.supplier LIKE :c', { c: `%${customer}%` });
        if (startDate || endDate) {
            const { start, end } = (0, date_range_1.clipToDate)(startDate, endDate);
            if (start)
                qb.andWhere('in.inboundDate >= :sd', { sd: start });
            if (end)
                qb.andWhere('in.inboundDate <= :ed', { ed: end });
        }
        const total = await qb.getCount();
        const rows = await qb
            .orderBy('in.inboundDate', 'DESC')
            .skip((p - 1) * ps)
            .take(ps)
            .getMany();
        const list = rows.map((p) => {
            const ino = p.inboundOrder || {};
            const cf = ino.colorFabric || {};
            const inboundDateStr = String(ino.inboundDate || p.inboundDate || '').substring(0, 10);
            const payableAmount = Number(((p.payableAmount
                ? Number(p.payableAmount)
                : Number(ino.amount || 0)) || 0).toFixed(2));
            const paidAmount = Number(Number(p.paidAmount || 0).toFixed(2));
            const unpaidAmount = Number((p.unpaidAmount !== undefined && p.unpaidAmount !== null
                ? Number(p.unpaidAmount)
                : payableAmount - paidAmount).toFixed(2));
            return {
                id: p.id,
                inboundDate: inboundDateStr,
                inboundNo: ino.inboundNo || p.inboundNo,
                supplier: p.supplier || ino.supplier,
                code: p.code || cf.colorFabricNo || '',
                productSpec: p.productSpec || cf.productSpec || '',
                composition: p.composition || cf.composition || '',
                color: p.color || cf.color || '',
                craft: p.craft || '',
                fabricWeight: p.fabricWeight || cf.weight || '',
                customerRemark: p.customerRemark || '',
                pieceCount: p.pieceCount !== null ? p.pieceCount : ino.quantity || 0,
                totalWeight: Number(p.totalWeight !== null ? p.totalWeight : ino.weightKg || 0),
                unitPrice: Number(p.unitPrice !== null ? p.unitPrice : ino.unitPrice || 0),
                quantity: Number(ino.quantity || 0),
                weightKg: Number(ino.weightKg || 0),
                payableAmount,
                paidAmount,
                unpaidAmount,
                taxInvoiceAmount: Number(Number(p.taxInvoiceAmount || 0).toFixed(2)),
                source: p.source,
                deletedAt: p.deletedAt,
                remark: p.remark,
            };
        });
        const sumQb = this.repo
            .createQueryBuilder('p')
            .leftJoin('p.inboundOrder', 'in')
            .where('p.deletedAt IS NULL');
        if (customer)
            sumQb.andWhere('p.supplier LIKE :c', { c: `%${customer}%` });
        if (startDate || endDate) {
            const { start, end } = (0, date_range_1.clipToDate)(startDate, endDate);
            if (start)
                sumQb.andWhere('in.inboundDate >= :sd', { sd: start });
            if (end)
                sumQb.andWhere('in.inboundDate <= :ed', { ed: end });
        }
        const sumRaw = await sumQb
            .select([
            'COALESCE(SUM(CAST(p.payableAmount AS DECIMAL(20,2))),0) AS totalPayable',
            'COALESCE(SUM(CAST(p.paidAmount AS DECIMAL(20,2))),0) AS totalPaid',
            'COALESCE(SUM(CAST(p.unpaidAmount AS DECIMAL(20,2))),0) AS totalUnpaid',
            'COALESCE(SUM(CAST(p.taxInvoiceAmount AS DECIMAL(20,2))),0) AS taxInvoiceTotal',
        ])
            .getRawOne();
        const globalSumRaw = await this.repo
            .createQueryBuilder('p')
            .leftJoin('p.inboundOrder', 'in')
            .where('p.deletedAt IS NULL')
            .select([
            'COALESCE(SUM(CAST(p.payableAmount AS DECIMAL(20,2))),0) AS totalPayable',
            'COALESCE(SUM(CAST(p.paidAmount AS DECIMAL(20,2))),0) AS totalPaid',
            'COALESCE(SUM(CAST(p.unpaidAmount AS DECIMAL(20,2))),0) AS totalUnpaid',
            'COALESCE(SUM(CAST(p.taxInvoiceAmount AS DECIMAL(20,2))),0) AS taxInvoiceTotal',
        ])
            .getRawOne();
        const summary = {
            payable: {
                totalPayable: Number(Number(sumRaw?.totalPayable || 0).toFixed(2)),
                totalPaid: Number(Number(sumRaw?.totalPaid || 0).toFixed(2)),
                totalUnpaid: Number(Number(sumRaw?.totalUnpaid || 0).toFixed(2)),
                taxInvoiceTotal: Number(Number(sumRaw?.taxInvoiceTotal || 0).toFixed(2)),
            },
        };
        const globalSummary = {
            payable: {
                totalPayable: Number(Number(globalSumRaw?.totalPayable || 0).toFixed(2)),
                totalPaid: Number(Number(globalSumRaw?.totalPaid || 0).toFixed(2)),
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
            inboundOrder: dto.inboundOrder,
            inboundDate: String(dto.inboundDate || '').substring(0, 10) || null,
            inboundNo: String(dto.inboundNo || '') || null,
            supplier: String(dto.supplier || ''),
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
            payableAmount: String(dto.payableAmount || '0'),
            paidAmount: String(dto.paidAmount || '0'),
            unpaidAmount: String((Number(dto.payableAmount || 0) - Number(dto.paidAmount || 0)).toFixed(2)),
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
        const p = await this.repo.findOne({
            where: { id },
            relations: ['inboundOrder', 'inboundOrder.colorFabric'],
        });
        if (!p)
            return null;
        const ino = p.inboundOrder || {};
        const cf = ino.colorFabric || {};
        const taxAttachments = await this.attachments.listTaxByRef(id);
        const otherAttachments = await this.attachments.listOtherByRef(id);
        const base = process.env.FILE_BASE || '';
        const mapPath = (pa) => (base ? `${base}${pa}` : pa);
        return {
            id: p.id,
            inboundDate: String(ino.inboundDate || p.inboundDate || '').substring(0, 10),
            inboundNo: ino.inboundNo || p.inboundNo,
            supplier: p.supplier || ino.supplier,
            code: p.code || cf.colorFabricNo || '',
            colorNo: cf.colorNo || '',
            batchNo: cf.batchNo || '',
            productSpec: p.productSpec || cf.productSpec || '',
            composition: p.composition || cf.composition || '',
            color: p.color || cf.color || '',
            craft: p.craft || '',
            fabricWeight: p.fabricWeight || cf.weight || '',
            customerRemark: p.customerRemark || '',
            pieceCount: p.pieceCount !== null ? p.pieceCount : ino.quantity || 0,
            totalWeight: Number(p.totalWeight !== null ? p.totalWeight : ino.weightKg || 0),
            unitPrice: Number(p.unitPrice !== null ? p.unitPrice : ino.unitPrice || 0),
            payableAmount: Number(p.payableAmount || 0),
            paidAmount: Number(p.paidAmount || 0),
            unpaidAmount: Number(p.unpaidAmount || 0),
            taxInvoiceAmount: Number(p.taxInvoiceAmount || 0),
            remark: p.remark,
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
            'supplier',
            'payableAmount',
            'paidAmount',
            'taxInvoiceAmount',
            'source',
            'sourceId',
            'remark',
            'inboundNo',
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
        if (dto.inboundDate !== undefined) {
            patch.inboundDate = String(dto.inboundDate || '').substring(0, 10);
        }
        if (dto.deletedAt !== undefined)
            patch.deletedAt = new Date(String(dto.deletedAt));
        if (dto.payableAmount !== undefined ||
            dto.paidAmount !== undefined) {
            const existing = await this.repo.findOne({ where: { id } });
            const rec = dto.payableAmount !== undefined
                ? Number(dto.payableAmount)
                : Number(existing?.payableAmount || 0);
            const got = dto.paidAmount !== undefined
                ? Number(dto.paidAmount)
                : Number(existing?.paidAmount || 0);
            patch.unpaidAmount = String((rec - got).toFixed(2));
        }
        patch.updatedAt = new Date();
        await this.repo.update({ id }, patch);
        return await this.repo.findOne({
            where: { id },
            relations: ['inboundOrder'],
        });
    }
};
exports.PayableController = PayableController;
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
], PayableController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PayableController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PayableController.prototype, "detail", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PayableController.prototype, "update", null);
exports.PayableController = PayableController = __decorate([
    (0, swagger_1.ApiTags)('finance-payable'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('finance/payable'),
    __param(0, (0, typeorm_1.InjectRepository)(payable_entity_1.Payable)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        attachments_service_1.AttachmentsService])
], PayableController);
//# sourceMappingURL=payable.controller.js.map