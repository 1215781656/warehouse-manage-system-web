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
exports.OutboundController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const date_range_1 = require("../../utils/date-range");
const outbound_entity_1 = require("./outbound.entity");
const inventory_entity_1 = require("../stock/inventory.entity");
const color_fabric_entity_1 = require("../fabric/color-fabric.entity");
const jwt_guard_1 = require("../../auth/jwt.guard");
const swagger_1 = require("@nestjs/swagger");
const receivable_entity_1 = require("../../finance/receivable/receivable.entity");
const tax_invoice_attachment_entity_1 = require("../../finance/attachments/tax-invoice-attachment.entity");
let OutboundController = class OutboundController {
    constructor(repo, invRepo, fabricRepo, receivableRepo, attRepo) {
        this.repo = repo;
        this.invRepo = invRepo;
        this.fabricRepo = fabricRepo;
        this.receivableRepo = receivableRepo;
        this.attRepo = attRepo;
    }
    async list(customer, outboundNo, deliveryNo, colorFabricNo, productSpec, dateStart, dateEnd) {
        const qb = this.repo
            .createQueryBuilder('out')
            .leftJoinAndSelect('out.colorFabric', 'cf');
        if (customer)
            qb.andWhere('out.customer LIKE :customer', { customer: `%${customer}%` });
        if (outboundNo)
            qb.andWhere('out.outboundNo LIKE :outboundNo', {
                outboundNo: `%${outboundNo}%`,
            });
        if (deliveryNo)
            qb.andWhere('out.deliveryNo LIKE :deliveryNo', {
                deliveryNo: `%${deliveryNo}%`,
            });
        if (colorFabricNo)
            qb.andWhere('cf.colorFabricNo LIKE :cfno', {
                cfno: `%${colorFabricNo}%`,
            });
        if (productSpec)
            qb.andWhere('cf.productSpec LIKE :spec', {
                spec: `%${productSpec}%`,
            });
        if (dateStart || dateEnd) {
            const { start, end } = (0, date_range_1.clipToDate)(dateStart, dateEnd);
            if (start)
                qb.andWhere('out.outboundDate >= :ds', { ds: start });
            if (end)
                qb.andWhere('out.outboundDate <= :de', { de: end });
        }
        return qb.orderBy('out.outboundDate', 'DESC').getMany();
    }
    async create(dto) {
        if (!dto.consignee)
            throw new common_1.BadRequestException('签收人必填');
        let fabric = dto.colorFabric;
        if (!fabric && dto.colorFabricId) {
            fabric = (await this.fabricRepo.findOne({
                where: { id: dto.colorFabricId },
            }));
        }
        const inv = await this.invRepo.findOne({
            where: { colorFabric: { id: fabric?.id } },
            relations: ['colorFabric'],
        });
        const rawDetails = Array.isArray(dto.outboundDetails)
            ? dto.outboundDetails
            : [];
        const detailsArr = rawDetails.map(Number);
        if (detailsArr.length) {
            if (!detailsArr.every((n) => Number.isFinite(n) && n > 0 && n <= 1000)) {
                throw new common_1.BadRequestException('重量明细需为正数');
            }
            dto.quantity = detailsArr.length;
            dto.weightKg = detailsArr
                .reduce((a, b) => a + Number(b || 0), 0)
                .toFixed(2);
        }
        if (dto.quantity !== undefined &&
            detailsArr.length &&
            Number(dto.quantity) !== detailsArr.length) {
            throw new common_1.BadRequestException('匹数需与明细数量一致');
        }
        if (inv && inv.currentQuantity < Number(dto.quantity || 0)) {
            throw new common_1.BadRequestException('库存不足');
        }
        if (dto.unitPrice && dto.weightKg && !dto.amount) {
            const amount = Number(dto.unitPrice) * Number(dto.weightKg);
            dto.amount = amount.toFixed(2);
        }
        try {
            const entity = this.repo.create({
                outboundNo: dto.outboundNo,
                code: dto.code,
                outboundDate: String(dto.outboundDate || '').substring(0, 10),
                customer: dto.customer,
                quantity: Number(dto.quantity || 0),
                weightKg: dto.weightKg,
                outboundDetails: detailsArr.length ? detailsArr : null,
                unitPrice: dto.unitPrice,
                amount: dto.amount,
                consignee: dto.consignee,
                deliveryNo: dto.deliveryNo,
                colorFabric: fabric,
                composition: dto.composition,
                color: dto.color,
                process: dto.process,
                gramWeight: dto.gramWeight,
                customerNote: dto.customerNote,
                remark: dto.remark,
            });
            const saved = await this.repo.save(entity);
            if (inv) {
                inv.totalOutboundQuantity =
                    (inv.totalOutboundQuantity || 0) + Number(dto.quantity || 0);
                inv.totalOutboundWeight = (Number(inv.totalOutboundWeight || 0) +
                    Number(dto.weightKg || 0)).toFixed(2);
                inv.currentQuantity =
                    (inv.totalInboundQuantity || 0) - (inv.totalOutboundQuantity || 0);
                inv.currentWeight = (Number(inv.totalInboundWeight || 0) -
                    Number(inv.totalOutboundWeight || 0)).toFixed(2);
                await this.invRepo.save(inv);
            }
            await this.receivableRepo.save(this.receivableRepo.create({
                outboundOrder: saved,
                customer: String(dto.customer || ''),
                receivableAmount: String(dto.amount || '0'),
                receivedAmount: String(0),
                unpaidAmount: String(Number(dto.amount || 0).toFixed(2)),
                taxInvoiceAmount: String(0),
                source: 'outbound',
                sourceId: saved.id,
                createdAt: new Date(),
                updatedAt: new Date(),
            }));
            return saved;
        }
        catch (e) {
            if (e?.code === 'ER_DUP_ENTRY') {
                throw new common_1.BadRequestException('出库单号或编号重复');
            }
            if (e?.message?.includes('Incorrect date value')) {
                throw new common_1.BadRequestException('出货日期格式错误，请选择有效日期');
            }
            throw new common_1.BadRequestException(e?.message || '新增出库失败');
        }
    }
    async batchCreate(body) {
        const common = body?.common || {};
        const items = Array.isArray(body?.items) ? body.items : [];
        if (!items.length)
            throw new common_1.BadRequestException('无有效出库项目');
        try {
            return await this.repo.manager.transaction(async (manager) => {
                const repo = manager.getRepository(outbound_entity_1.OutboundOrder);
                const invRepo = manager.getRepository(inventory_entity_1.Inventory);
                const fabricRepo = manager.getRepository(color_fabric_entity_1.ColorFabric);
                const toInsert = [];
                const invDelta = {};
                const fabricCache = {};
                for (const item of items) {
                    const fabricId = item.colorFabricId;
                    if (!fabricId)
                        throw new common_1.BadRequestException('色布ID必填');
                    let fabric = fabricCache[fabricId];
                    if (!fabric) {
                        fabric = (await fabricRepo.findOne({
                            where: { id: fabricId },
                        }));
                        if (!fabric)
                            throw new common_1.BadRequestException('色布ID无效');
                        fabricCache[fabricId] = fabric;
                    }
                    const inv = await invRepo.findOne({
                        where: { colorFabric: { id: fabric.id } },
                        relations: ['colorFabric'],
                    });
                    const rawDetails = Array.isArray(item.outboundDetails)
                        ? item.outboundDetails
                        : [];
                    const detailsArr = rawDetails.map(Number);
                    if (detailsArr.length &&
                        !detailsArr.every((n) => Number.isFinite(n) && n > 0 && n <= 1000)) {
                        throw new common_1.BadRequestException('重量明细需为正数');
                    }
                    const qty = detailsArr.length || Number(item.quantity || 0);
                    if (detailsArr.length && qty !== detailsArr.length) {
                        throw new common_1.BadRequestException('匹数需与明细数量一致');
                    }
                    const weight = detailsArr.length
                        ? detailsArr.reduce((a, b) => a + b, 0)
                        : Number(item.weightKg || 0);
                    if (inv && inv.currentQuantity < qty)
                        throw new common_1.BadRequestException('库存不足');
                    const unitPrice = Number(item.unitPrice || 0);
                    const amount = unitPrice && weight
                        ? (unitPrice * Number(weight)).toFixed(2)
                        : item.amount;
                    toInsert.push({
                        id: item.id,
                        outboundNo: common.outboundNo,
                        code: common.code,
                        outboundDate: String(common.outboundDate || '').substring(0, 10),
                        customer: common.customer,
                        quantity: qty,
                        weightKg: weight.toFixed(2),
                        outboundDetails: detailsArr.length ? detailsArr : null,
                        unitPrice: unitPrice,
                        amount: amount,
                        consignee: common.consignee,
                        deliveryNo: common.deliveryNo,
                        colorFabric: fabric,
                        composition: item.composition,
                        color: item.color,
                        process: item.process,
                        gramWeight: item.gramWeight,
                        customerNote: item.customerNote,
                        remark: item.remark,
                    });
                    const k = fabric.id;
                    invDelta[k] = invDelta[k] || { qty: 0, weight: 0 };
                    invDelta[k].qty += qty;
                    invDelta[k].weight += Number(weight);
                }
                const insertResult = await repo.insert(toInsert);
                for (const [fid, delta] of Object.entries(invDelta)) {
                    const inv = await invRepo.findOne({
                        where: { colorFabric: { id: fid } },
                        relations: ['colorFabric'],
                    });
                    if (inv) {
                        inv.totalOutboundQuantity =
                            Number(inv.totalOutboundQuantity || 0) + delta.qty;
                        inv.totalOutboundWeight = (Number(inv.totalOutboundWeight || 0) + delta.weight).toFixed(2);
                        inv.currentQuantity =
                            (inv.totalInboundQuantity || 0) -
                                (inv.totalOutboundQuantity || 0);
                        inv.currentWeight = (Number(inv.totalInboundWeight || 0) -
                            Number(inv.totalOutboundWeight || 0)).toFixed(2);
                        await invRepo.save(inv);
                    }
                }
                const ids = insertResult.identifiers?.map((x) => x.id) || [];
                const saved = ids.length
                    ? await repo.find({
                        where: { id: (0, typeorm_2.In)(ids) },
                        relations: ['colorFabric'],
                    })
                    : [];
                const recRepo = manager.getRepository(receivable_entity_1.Receivable);
                for (const ord of saved) {
                    const amt = Number(ord.amount || 0);
                    await recRepo.save(recRepo.create({
                        outboundOrder: ord,
                        customer: String(ord.customer || ''),
                        receivableAmount: String(amt.toFixed(2)),
                        receivedAmount: String(0),
                        unpaidAmount: String(amt.toFixed(2)),
                        taxInvoiceAmount: String(0),
                        source: 'outbound',
                        sourceId: String(ord.id),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    }));
                }
                return { success: true, items: saved };
            });
        }
        catch (e) {
            if (e?.code === 'ER_DUP_ENTRY') {
                throw new common_1.BadRequestException('出库单号或编号重复');
            }
            if (e?.message?.includes('Incorrect date value')) {
                throw new common_1.BadRequestException('出货日期格式错误，请选择有效日期');
            }
            throw new common_1.BadRequestException(e?.message || '批量出库失败');
        }
    }
    async detail(id) {
        const r = await this.repo.findOne({
            where: { id },
            relations: ['colorFabric'],
        });
        if (!r)
            return null;
        const taxAttachments = await this.attRepo.find({
            where: { refId: id },
            order: { uploadedAt: 'DESC' },
        });
        return { ...r, taxAttachments };
    }
    async update(id, dto) {
        return this.repo.manager.transaction(async (manager) => {
            const repo = manager.getRepository(outbound_entity_1.OutboundOrder);
            const invRepo = manager.getRepository(inventory_entity_1.Inventory);
            const existing = await repo.findOne({
                where: { id },
                relations: ['colorFabric'],
            });
            if (!existing)
                return null;
            const patch = {};
            let newFabricId = existing.colorFabric.id;
            if (dto.colorFabricId &&
                dto.colorFabricId !== existing.colorFabric.id) {
                newFabricId = dto.colorFabricId;
                const fabricRepo = manager.getRepository(color_fabric_entity_1.ColorFabric);
                const newFabric = await fabricRepo.findOne({
                    where: { id: newFabricId },
                });
                if (!newFabric)
                    throw new common_1.BadRequestException('新的色布ID无效');
                patch.colorFabric = newFabric;
            }
            const oldQty = Number(existing.quantity || 0);
            const oldWeight = Number(existing.weightKg || 0);
            const rawDetails = Array.isArray(dto.outboundDetails)
                ? dto.outboundDetails
                : [];
            const detailsArr = rawDetails.map((x) => Number(x));
            if (detailsArr.length) {
                if (!detailsArr.every((n) => Number.isFinite(n) && n > 0 && n <= 1000)) {
                    throw new common_1.BadRequestException('重量明细需为正数');
                }
                dto.quantity = detailsArr.length;
                dto.weightKg = detailsArr
                    .reduce((a, b) => a + Number(b || 0), 0)
                    .toFixed(2);
            }
            if (dto.unitPrice && dto.weightKg && !dto.amount) {
                const amount = Number(dto.unitPrice) * Number(dto.weightKg);
                dto.amount = amount.toFixed(2);
            }
            [
                'outboundNo',
                'code',
                'customer',
                'unitPrice',
                'amount',
                'consignee',
                'deliveryNo',
                'composition',
                'color',
                'process',
                'gramWeight',
                'customerNote',
                'remark',
            ].forEach((k) => {
                const v = dto[k];
                if (v !== undefined)
                    patch[k] = v;
            });
            if (dto.outboundDate !== undefined) {
                patch.outboundDate = String(dto.outboundDate).substring(0, 10);
            }
            if (dto.quantity !== undefined) {
                patch.quantity = Number(dto.quantity || 0);
            }
            if (dto.weightKg !== undefined) {
                patch.weightKg = dto.weightKg;
            }
            if (dto.outboundDetails !== undefined) {
                const arr = Array.isArray(dto.outboundDetails)
                    ? dto.outboundDetails.map(Number)
                    : [];
                if (arr.length &&
                    !arr.every((n) => Number.isFinite(n) && n > 0 && n <= 1000)) {
                    throw new common_1.BadRequestException('重量明细需为正数');
                }
                if (arr.length) {
                    patch.quantity = arr.length;
                    patch.weightKg = arr
                        .reduce((a, b) => a + b, 0)
                        .toFixed(2);
                    patch.outboundDetails = arr;
                }
            }
            await repo.update({ id }, patch);
            const updated = await repo.findOne({
                where: { id },
                relations: ['colorFabric'],
            });
            const newQty = Number(updated?.quantity || 0);
            const newWeight = Number(updated?.weightKg || 0);
            const oldInv = await invRepo.findOne({
                where: { colorFabric: { id: existing.colorFabric.id } },
                relations: ['colorFabric'],
            });
            if (oldInv) {
                oldInv.totalOutboundQuantity =
                    Number(oldInv.totalOutboundQuantity || 0) - oldQty;
                oldInv.totalOutboundWeight = (Number(oldInv.totalOutboundWeight || 0) - oldWeight).toFixed(2);
                oldInv.currentQuantity =
                    (oldInv.totalInboundQuantity || 0) -
                        (oldInv.totalOutboundQuantity || 0);
                oldInv.currentWeight = (Number(oldInv.totalInboundWeight || 0) -
                    Number(oldInv.totalOutboundWeight || 0)).toFixed(2);
                await invRepo.save(oldInv);
            }
            const newInv = await invRepo.findOne({
                where: { colorFabric: { id: newFabricId } },
                relations: ['colorFabric'],
            });
            if (newInv) {
                newInv.totalOutboundQuantity =
                    Number(newInv.totalOutboundQuantity || 0) + newQty;
                newInv.totalOutboundWeight = (Number(newInv.totalOutboundWeight || 0) + newWeight).toFixed(2);
                const newCurrentQty = (newInv.totalInboundQuantity || 0) -
                    (newInv.totalOutboundQuantity || 0);
                if (newCurrentQty < 0) {
                    throw new common_1.BadRequestException('修改后库存不足');
                }
                newInv.currentQuantity = newCurrentQty;
                newInv.currentWeight = (Number(newInv.totalInboundWeight || 0) -
                    Number(newInv.totalOutboundWeight || 0)).toFixed(2);
                await invRepo.save(newInv);
            }
            return updated;
        });
    }
    async remove(id) {
        return this.repo.manager.transaction(async (manager) => {
            const repo = manager.getRepository(outbound_entity_1.OutboundOrder);
            const invRepo = manager.getRepository(inventory_entity_1.Inventory);
            const existing = await repo.findOne({
                where: { id },
                relations: ['colorFabric'],
            });
            if (!existing) {
                throw new common_1.NotFoundException('出库记录不存在');
            }
            const oldQty = Number(existing.quantity || 0);
            const oldWeight = Number(existing.weightKg || 0);
            await repo.delete({ id });
            const recRepo = manager.getRepository(receivable_entity_1.Receivable);
            const receivable = await recRepo.findOne({
                where: { outboundOrder: { id } },
            });
            if (receivable) {
                await recRepo.update({ id: receivable.id }, {
                    deletedAt: new Date(),
                });
            }
            const inv = await invRepo.findOne({
                where: { colorFabric: { id: existing.colorFabric.id } },
                relations: ['colorFabric'],
            });
            if (inv) {
                inv.totalOutboundQuantity =
                    Number(inv.totalOutboundQuantity || 0) - oldQty;
                inv.totalOutboundWeight = (Number(inv.totalOutboundWeight || 0) - oldWeight).toFixed(2);
                inv.currentQuantity =
                    (inv.totalInboundQuantity || 0) - (inv.totalOutboundQuantity || 0);
                inv.currentWeight = (Number(inv.totalInboundWeight || 0) -
                    Number(inv.totalOutboundWeight || 0)).toFixed(2);
                await invRepo.save(inv);
            }
            return { success: true };
        });
    }
};
exports.OutboundController = OutboundController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('customer')),
    __param(1, (0, common_1.Query)('outboundNo')),
    __param(2, (0, common_1.Query)('deliveryNo')),
    __param(3, (0, common_1.Query)('colorFabricNo')),
    __param(4, (0, common_1.Query)('productSpec')),
    __param(5, (0, common_1.Query)('dateStart')),
    __param(6, (0, common_1.Query)('dateEnd')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], OutboundController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OutboundController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('batch'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OutboundController.prototype, "batchCreate", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OutboundController.prototype, "detail", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OutboundController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OutboundController.prototype, "remove", null);
exports.OutboundController = OutboundController = __decorate([
    (0, swagger_1.ApiTags)('inventory-out'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('inventory/out'),
    __param(0, (0, typeorm_1.InjectRepository)(outbound_entity_1.OutboundOrder)),
    __param(1, (0, typeorm_1.InjectRepository)(inventory_entity_1.Inventory)),
    __param(2, (0, typeorm_1.InjectRepository)(color_fabric_entity_1.ColorFabric)),
    __param(3, (0, typeorm_1.InjectRepository)(receivable_entity_1.Receivable)),
    __param(4, (0, typeorm_1.InjectRepository)(tax_invoice_attachment_entity_1.TaxInvoiceAttachment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], OutboundController);
//# sourceMappingURL=outbound.controller.js.map