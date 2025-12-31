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
exports.InboundController = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const inbound_entity_1 = require("./inbound.entity");
const jwt_guard_1 = require("../../auth/jwt.guard");
const swagger_1 = require("@nestjs/swagger");
const color_fabric_entity_1 = require("../fabric/color-fabric.entity");
const inventory_entity_1 = require("../stock/inventory.entity");
const operation_log_entity_1 = require("../../system/operation-log.entity");
const inbound_batch_entity_1 = require("./inbound-batch.entity");
const date_range_1 = require("../../utils/date-range");
const payable_entity_1 = require("../../finance/payable/payable.entity");
const tax_invoice_attachment_entity_1 = require("../../finance/attachments/tax-invoice-attachment.entity");
let InboundController = class InboundController {
    constructor(repo, fabricRepo, invRepo, logRepo, batchRepo, payableRepo, attRepo) {
        this.repo = repo;
        this.fabricRepo = fabricRepo;
        this.invRepo = invRepo;
        this.logRepo = logRepo;
        this.batchRepo = batchRepo;
        this.payableRepo = payableRepo;
        this.attRepo = attRepo;
    }
    async list(supplier, colorNo, keyword, inboundNo, productSpec, composition, dateStart, dateEnd) {
        const qb = this.repo
            .createQueryBuilder('in')
            .leftJoinAndSelect('in.colorFabric', 'cf')
            .where('in.deletedAt IS NULL');
        if (supplier) {
            qb.andWhere('in.supplier LIKE :supplier', { supplier: `%${supplier}%` });
        }
        if (colorNo) {
            qb.andWhere('cf.colorNo LIKE :colorNo', { colorNo: `%${colorNo}%` });
        }
        if (inboundNo) {
            qb.andWhere('in.inboundNo LIKE :inboundNo', {
                inboundNo: `%${inboundNo}%`,
            });
        }
        if (productSpec) {
            qb.andWhere('cf.productSpec LIKE :productSpec', {
                productSpec: `%${productSpec}%`,
            });
        }
        if (composition) {
            qb.andWhere('cf.composition LIKE :composition', {
                composition: `%${composition}%`,
            });
        }
        if (keyword) {
            qb.andWhere('(in.inboundNo LIKE :kw OR cf.productSpec LIKE :kw OR cf.color LIKE :kw)', { kw: `%${keyword}%` });
        }
        if (dateStart || dateEnd) {
            const { start, end } = (0, date_range_1.clipToDate)(dateStart, dateEnd);
            if (start)
                qb.andWhere('in.inboundDate >= :start', { start });
            if (end)
                qb.andWhere('in.inboundDate <= :end', { end });
        }
        return qb.orderBy('in.inboundDate', 'DESC').getMany();
    }
    async detail(id) {
        const order = await this.repo.findOne({
            where: { id },
            relations: ['colorFabric'],
        });
        if (!order)
            return null;
        const taxAttachments = await this.attRepo.find({
            where: { refId: id },
            order: { uploadedAt: 'DESC' },
        });
        return { ...order, taxAttachments };
    }
    async create(dto) {
        if (dto.unitPrice && dto.weightKg && !dto.amount) {
            const amount = Number(dto.unitPrice) * Number(dto.weightKg);
            dto.amount = amount.toFixed(2);
        }
        let fabric = dto.colorFabric;
        if (!fabric) {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const serial = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
            const colorFabricNo = `CB_${year}${month}_${serial}`;
            fabric = this.fabricRepo.create({
                colorFabricNo,
                productSpec: dto.productSpec,
                composition: dto.composition,
                weight: Number(dto.weight || 0),
                width: Number(dto.width || 0),
                color: dto.color,
                colorNo: dto.colorNo,
                batchNo: dto.batchNo,
            });
            fabric = await this.fabricRepo.save(fabric);
        }
        const entity = this.repo.create({
            inboundNo: dto.inboundNo,
            inboundDate: (dto.inboundDate || '').substring(0, 10),
            supplier: dto.supplier,
            quantity: Number(dto.quantity || 0),
            weightKg: dto.weightKg,
            unitPrice: dto.unitPrice,
            amount: dto.amount,
            operator: dto.operator,
            colorFabric: fabric,
        });
        const saved = (await this.repo.save(entity));
        let inv = await this.invRepo.findOne({
            where: { colorFabric: { id: fabric.id } },
            relations: ['colorFabric'],
        });
        if (!inv) {
            inv = this.invRepo.create({ colorFabric: fabric });
        }
        inv.totalInboundQuantity =
            (inv.totalInboundQuantity || 0) + Number(dto.quantity || 0);
        inv.totalInboundWeight = (Number(inv.totalInboundWeight || 0) + Number(dto.weightKg || 0)).toFixed(2);
        inv.currentQuantity =
            (inv.totalInboundQuantity || 0) - (inv.totalOutboundQuantity || 0);
        inv.currentWeight = (Number(inv.totalInboundWeight || 0) - Number(inv.totalOutboundWeight || 0)).toFixed(2);
        await this.invRepo.save(inv);
        await this.logRepo.save(this.logRepo.create({
            module: 'inventory-in',
            action: 'create',
            refId: saved.id,
            operator: dto.operator || 'unknown',
            detail: JSON.stringify({ dto }),
        }));
        await this.payableRepo.save(this.payableRepo.create({
            inboundOrder: saved,
            supplier: String(dto.supplier || ''),
            payableAmount: String(dto.amount || '0'),
            paidAmount: String(0),
            unpaidAmount: String(Number(dto.amount || 0).toFixed(2)),
            taxInvoiceAmount: String(0),
            source: 'inbound',
            sourceId: saved.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));
        return saved;
    }
    async update(id, dto) {
        return this.repo.manager.transaction(async (manager) => {
            const repo = manager.getRepository(inbound_entity_1.InboundOrder);
            const invRepo = manager.getRepository(inventory_entity_1.Inventory);
            const fabricRepo = manager.getRepository(color_fabric_entity_1.ColorFabric);
            const logRepo = manager.getRepository(operation_log_entity_1.OperationLog);
            const existing = await repo.findOne({
                where: { id },
                relations: ['colorFabric'],
            });
            if (!existing)
                return null;
            const oldQty = Number(existing.quantity || 0);
            const oldWeight = Number(existing.weightKg || 0);
            if (dto.unitPrice && dto.weightKg && !dto.amount) {
                const amount = Number(dto.unitPrice) * Number(dto.weightKg);
                dto.amount = amount.toFixed(2);
            }
            const fabric = existing.colorFabric;
            const fabricPatch = {};
            [
                'productSpec',
                'composition',
                'weight',
                'width',
                'color',
                'colorNo',
                'batchNo',
            ].forEach((k) => {
                const v = dto[k];
                if (v !== undefined)
                    fabricPatch[k] = v;
            });
            if (Object.keys(fabricPatch).length) {
                await fabricRepo.update({ id: fabric.id }, fabricPatch);
            }
            const patch = {};
            ['inboundNo', 'supplier', 'unitPrice', 'amount', 'operator'].forEach((k) => {
                const v = dto[k];
                if (v !== undefined)
                    patch[k] = v;
            });
            if (dto.inboundDate !== undefined) {
                patch.inboundDate = String(dto.inboundDate).substring(0, 10);
            }
            if (dto.quantity !== undefined) {
                patch.quantity = Number(dto.quantity || 0);
            }
            if (dto.weightKg !== undefined) {
                patch.weightKg = dto.weightKg;
            }
            await repo.update({ id }, patch);
            const updated = await repo.findOne({
                where: { id },
                relations: ['colorFabric'],
            });
            const newQty = Number(updated?.quantity || 0);
            const newWeight = Number(updated?.weightKg || 0);
            const inv = await invRepo.findOne({
                where: { colorFabric: { id: fabric.id } },
                relations: ['colorFabric'],
            });
            if (inv) {
                inv.totalInboundQuantity =
                    Number(inv.totalInboundQuantity || 0) - oldQty + newQty;
                inv.totalInboundWeight = (Number(inv.totalInboundWeight || 0) -
                    oldWeight +
                    newWeight).toFixed(2);
                inv.currentQuantity =
                    (inv.totalInboundQuantity || 0) - (inv.totalOutboundQuantity || 0);
                inv.currentWeight = (Number(inv.totalInboundWeight || 0) -
                    Number(inv.totalOutboundWeight || 0)).toFixed(2);
                await invRepo.save(inv);
            }
            await logRepo.save(logRepo.create({
                module: 'inventory-in',
                action: 'update',
                refId: id,
                operator: dto.operator || 'unknown',
                detail: JSON.stringify({
                    before: { quantity: oldQty, weightKg: oldWeight },
                    after: { quantity: newQty, weightKg: newWeight },
                }),
            }));
            return updated;
        });
    }
    async softDelete(id, body) {
        return this.repo.manager.transaction(async (manager) => {
            const repo = manager.getRepository(inbound_entity_1.InboundOrder);
            const invRepo = manager.getRepository(inventory_entity_1.Inventory);
            const logRepo = manager.getRepository(operation_log_entity_1.OperationLog);
            const existing = await repo.findOne({
                where: { id },
                relations: ['colorFabric'],
            });
            if (!existing)
                return null;
            await repo.update({ id }, { deletedAt: new Date() });
            const payRepo = manager.getRepository(payable_entity_1.Payable);
            const payable = await payRepo.findOne({
                where: { inboundOrder: { id } },
            });
            if (payable) {
                await payRepo.update({ id: payable.id }, {
                    deletedAt: new Date(),
                });
            }
            const inv = await invRepo.findOne({
                where: { colorFabric: { id: existing.colorFabric.id } },
                relations: ['colorFabric'],
            });
            if (inv) {
                await invRepo.delete({ id: inv.id });
            }
            await logRepo.save(logRepo.create({
                module: 'inventory-in',
                action: 'delete',
                refId: id,
                operator: body?.operator || 'unknown',
                detail: JSON.stringify({
                    record: { id, inboundNo: existing.inboundNo },
                }),
            }));
            return { success: true };
        });
    }
    async batchDetail(id) {
        const batch = await this.batchRepo.findOne({ where: { id } });
        if (!batch)
            return null;
        const items = await this.repo.find({
            where: { batch: { id } },
            relations: ['colorFabric', 'batch'],
            order: { createdAt: 'ASC' },
        });
        const itemsWithAttachments = await Promise.all(items.map(async (it) => {
            const taxAttachments = await this.attRepo.find({
                where: { refId: it.id },
                order: { uploadedAt: 'DESC' },
            });
            return { ...it, taxAttachments };
        }));
        return { batch, items: itemsWithAttachments };
    }
    async createBatch(body) {
        return this.repo.manager.transaction(async (manager) => {
            if (!body?.batch?.inboundNo ||
                !body?.batch?.supplier ||
                !body?.batch?.inboundDate) {
                throw new common_2.BadRequestException('批次信息不完整');
            }
            if (!body?.items?.length) {
                throw new common_2.BadRequestException('至少需要一条色布明细');
            }
            const batchRepo = manager.getRepository(inbound_batch_entity_1.InboundBatch);
            const fabricRepo = manager.getRepository(color_fabric_entity_1.ColorFabric);
            const inRepo = manager.getRepository(inbound_entity_1.InboundOrder);
            const invRepo = manager.getRepository(inventory_entity_1.Inventory);
            const logRepo = manager.getRepository(operation_log_entity_1.OperationLog);
            const b = batchRepo.create({
                inboundNo: String(body.batch.inboundNo || ''),
                inboundDate: String(body.batch.inboundDate || '').substring(0, 10),
                supplier: String(body.batch.supplier || ''),
                operator: String(body.batch.operator || 'unknown'),
            });
            const savedBatch = (await batchRepo.save(b));
            const createdItems = [];
            let totalAmount = 0;
            for (const it of body.items || []) {
                let fabric = null;
                if (it.colorFabricId) {
                    fabric = await fabricRepo.findOne({
                        where: { id: it.colorFabricId },
                    });
                }
                if (!fabric) {
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const serial = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
                    const colorFabricNo = `CB_${year}${month}_${serial}`;
                    fabric = fabricRepo.create({
                        colorFabricNo,
                        productSpec: it.productSpec,
                        composition: it.composition,
                        weight: Number(it.weight || 0),
                        width: Number(it.width || 0),
                        color: it.color,
                        colorNo: it.colorNo,
                        batchNo: it.batchNo,
                    });
                    fabric = await fabricRepo.save(fabric);
                }
                let amount = it.amount;
                if (!amount && it.unitPrice && it.weightKg) {
                    amount = (Number(it.unitPrice) * Number(it.weightKg)).toFixed(2);
                }
                totalAmount += Number(amount || 0);
                const entity = inRepo.create({
                    id: it.id,
                    inboundNo: String(body.batch.inboundNo || ''),
                    inboundDate: String(body.batch.inboundDate || '').substring(0, 10),
                    supplier: String(body.batch.supplier || ''),
                    quantity: Number(it.quantity || 0),
                    weightKg: it.weightKg,
                    unitPrice: it.unitPrice,
                    amount,
                    operator: String(body.batch.operator || 'unknown'),
                    colorFabric: fabric,
                    batch: savedBatch,
                });
                const savedOrder = await inRepo.save(entity);
                createdItems.push(savedOrder);
                let inv = await invRepo.findOne({
                    where: { colorFabric: { id: fabric.id } },
                    relations: ['colorFabric'],
                });
                if (!inv) {
                    inv = invRepo.create({ colorFabric: fabric });
                }
                inv.totalInboundQuantity =
                    (inv.totalInboundQuantity || 0) + Number(it.quantity || 0);
                inv.totalInboundWeight = (Number(inv.totalInboundWeight || 0) +
                    Number(it.weightKg || 0)).toFixed(2);
                inv.currentQuantity =
                    (inv.totalInboundQuantity || 0) - (inv.totalOutboundQuantity || 0);
                inv.currentWeight = (Number(inv.totalInboundWeight || 0) -
                    Number(inv.totalOutboundWeight || 0)).toFixed(2);
                await invRepo.save(inv);
            }
            await logRepo.save(logRepo.create({
                module: 'inventory-in',
                action: 'create-batch',
                refId: savedBatch.id,
                operator: String(body.batch.operator || 'unknown'),
                detail: JSON.stringify({
                    batch: body.batch,
                    count: (body.items || []).length,
                }),
            }));
            const payRepo = manager.getRepository(payable_entity_1.Payable);
            for (const ord of createdItems) {
                const amt = Number(ord.amount || 0);
                await payRepo.save(payRepo.create({
                    inboundOrder: ord,
                    supplier: String(ord.supplier || ''),
                    payableAmount: String(amt.toFixed(2)),
                    paidAmount: String(0),
                    unpaidAmount: String(amt.toFixed(2)),
                    taxInvoiceAmount: String(0),
                    source: 'inbound',
                    sourceId: String(ord.id),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }));
            }
            return {
                batch: savedBatch,
                items: createdItems,
                totalAmount: Number(totalAmount.toFixed(2)),
            };
        });
    }
    async updateBatch(id, body) {
        return this.repo.manager.transaction(async (manager) => {
            if (!body?.items)
                body.items = [];
            const batchRepo = manager.getRepository(inbound_batch_entity_1.InboundBatch);
            const fabricRepo = manager.getRepository(color_fabric_entity_1.ColorFabric);
            const inRepo = manager.getRepository(inbound_entity_1.InboundOrder);
            const invRepo = manager.getRepository(inventory_entity_1.Inventory);
            const logRepo = manager.getRepository(operation_log_entity_1.OperationLog);
            const existingBatch = await batchRepo.findOne({ where: { id } });
            if (!existingBatch)
                return null;
            const patch = {};
            ['inboundNo', 'supplier', 'operator'].forEach((k) => {
                const v = body.batch[k];
                if (v !== undefined)
                    patch[k] = v;
            });
            if (body.batch.inboundDate !== undefined) {
                patch.inboundDate = String(body.batch.inboundDate).substring(0, 10);
            }
            if (Object.keys(patch).length) {
                await batchRepo.update({ id }, patch);
            }
            const beforeItems = await inRepo.find({
                where: { batch: { id } },
                relations: ['colorFabric', 'batch'],
            });
            const inputIds = new Set((body.items || [])
                .map((x) => (x.id ? String(x.id) : ''))
                .filter((x) => !!x));
            for (const old of beforeItems) {
                if (!inputIds.has(old.id)) {
                    await inRepo.update({ id: old.id }, { deletedAt: new Date() });
                    const inv = await invRepo.findOne({
                        where: { colorFabric: { id: old.colorFabric.id } },
                        relations: ['colorFabric'],
                    });
                    if (inv) {
                        inv.totalInboundQuantity =
                            Number(inv.totalInboundQuantity || 0) - Number(old.quantity || 0);
                        inv.totalInboundWeight = (Number(inv.totalInboundWeight || 0) - Number(old.weightKg || 0)).toFixed(2);
                        inv.currentQuantity =
                            (inv.totalInboundQuantity || 0) -
                                (inv.totalOutboundQuantity || 0);
                        inv.currentWeight = (Number(inv.totalInboundWeight || 0) -
                            Number(inv.totalOutboundWeight || 0)).toFixed(2);
                        await invRepo.save(inv);
                    }
                }
            }
            for (const it of body.items || []) {
                let fabric = null;
                if (it.colorFabricId) {
                    fabric = await fabricRepo.findOne({
                        where: { id: it.colorFabricId },
                    });
                }
                if (!fabric) {
                    if (it.id) {
                        const existing = await inRepo.findOne({
                            where: { id: it.id },
                            relations: ['colorFabric'],
                        });
                        if (existing) {
                            const fp = {};
                            [
                                'productSpec',
                                'composition',
                                'weight',
                                'width',
                                'color',
                                'colorNo',
                                'batchNo',
                            ].forEach((k) => {
                                const v = it[k];
                                if (v !== undefined)
                                    fp[k] = v;
                            });
                            if (Object.keys(fp).length) {
                                await fabricRepo.update({ id: existing.colorFabric.id }, fp);
                            }
                            fabric = await fabricRepo.findOne({
                                where: { id: existing.colorFabric.id },
                            });
                        }
                    }
                }
                if (!fabric) {
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const serial = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
                    const colorFabricNo = `CB_${year}${month}_${serial}`;
                    fabric = fabricRepo.create({
                        colorFabricNo,
                        productSpec: it.productSpec,
                        composition: it.composition,
                        weight: Number(it.weight || 0),
                        width: Number(it.width || 0),
                        color: it.color,
                        colorNo: it.colorNo,
                        batchNo: it.batchNo,
                    });
                    fabric = await fabricRepo.save(fabric);
                }
                let amount = it.amount;
                if (!amount && it.unitPrice && it.weightKg) {
                    amount = (Number(it.unitPrice) * Number(it.weightKg)).toFixed(2);
                }
                if (it.id) {
                    const exist = await inRepo.findOne({ where: { id: it.id } });
                    if (!exist)
                        continue;
                    const oldQty = Number(exist.quantity || 0);
                    const oldWeight = Number(exist.weightKg || 0);
                    const patchOrder = {
                        quantity: Number(it.quantity || 0),
                        weightKg: it.weightKg,
                        unitPrice: it.unitPrice,
                        amount,
                        colorFabric: fabric,
                    };
                    await inRepo.update({ id: it.id }, patchOrder);
                    const inv = await invRepo.findOne({
                        where: { colorFabric: { id: fabric.id } },
                        relations: ['colorFabric'],
                    });
                    if (inv) {
                        inv.totalInboundQuantity =
                            Number(inv.totalInboundQuantity || 0) -
                                oldQty +
                                Number(it.quantity || 0);
                        inv.totalInboundWeight = (Number(inv.totalInboundWeight || 0) -
                            oldWeight +
                            Number(it.weightKg || 0)).toFixed(2);
                        inv.currentQuantity =
                            (inv.totalInboundQuantity || 0) -
                                (inv.totalOutboundQuantity || 0);
                        inv.currentWeight = (Number(inv.totalInboundWeight || 0) -
                            Number(inv.totalOutboundWeight || 0)).toFixed(2);
                        await invRepo.save(inv);
                    }
                }
                else {
                    const newOrder = inRepo.create({
                        inboundNo: String(existingBatch.inboundNo || ''),
                        inboundDate: String(existingBatch.inboundDate || '').substring(0, 10),
                        supplier: String(existingBatch.supplier || ''),
                        quantity: Number(it.quantity || 0),
                        weightKg: it.weightKg,
                        unitPrice: it.unitPrice,
                        amount,
                        operator: String(existingBatch.operator || 'unknown'),
                        colorFabric: fabric,
                        batch: existingBatch,
                    });
                    const saved = await inRepo.save(newOrder);
                    const inv = await invRepo.findOne({
                        where: { colorFabric: { id: fabric.id } },
                        relations: ['colorFabric'],
                    });
                    if (!inv) {
                        const newInv = invRepo.create({ colorFabric: fabric });
                        newInv.totalInboundQuantity = Number(it.quantity || 0);
                        newInv.totalInboundWeight = Number(it.weightKg || 0);
                        newInv.currentQuantity =
                            (newInv.totalInboundQuantity || 0) -
                                (newInv.totalOutboundQuantity || 0);
                        newInv.currentWeight = (Number(newInv.totalInboundWeight || 0) -
                            Number(newInv.totalOutboundWeight || 0)).toFixed(2);
                        await invRepo.save(newInv);
                    }
                    else {
                        inv.totalInboundQuantity =
                            (inv.totalInboundQuantity || 0) +
                                Number(it.quantity || 0);
                        inv.totalInboundWeight = (Number(inv.totalInboundWeight || 0) +
                            Number(it.weightKg || 0)).toFixed(2);
                        inv.currentQuantity =
                            (inv.totalInboundQuantity || 0) -
                                (inv.totalOutboundQuantity || 0);
                        inv.currentWeight = (Number(inv.totalInboundWeight || 0) -
                            Number(inv.totalOutboundWeight || 0)).toFixed(2);
                        await invRepo.save(inv);
                    }
                }
            }
            await logRepo.save(logRepo.create({
                module: 'inventory-in',
                action: 'update-batch',
                refId: id,
                operator: String(body.batch?.operator || 'unknown'),
                detail: JSON.stringify({ count: (body.items || []).length }),
            }));
            const batch = await batchRepo.findOne({ where: { id } });
            const items = await inRepo.find({
                where: { batch: { id } },
                relations: ['colorFabric', 'batch'],
            });
            return { batch, items };
        });
    }
};
exports.InboundController = InboundController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('supplier')),
    __param(1, (0, common_1.Query)('colorNo')),
    __param(2, (0, common_1.Query)('keyword')),
    __param(3, (0, common_1.Query)('inboundNo')),
    __param(4, (0, common_1.Query)('productSpec')),
    __param(5, (0, common_1.Query)('composition')),
    __param(6, (0, common_1.Query)('dateStart')),
    __param(7, (0, common_1.Query)('dateEnd')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], InboundController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InboundController.prototype, "detail", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InboundController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InboundController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InboundController.prototype, "softDelete", null);
__decorate([
    (0, common_1.Get)('batch/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InboundController.prototype, "batchDetail", null);
__decorate([
    (0, common_1.Post)('batch'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InboundController.prototype, "createBatch", null);
__decorate([
    (0, common_1.Put)('batch/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InboundController.prototype, "updateBatch", null);
exports.InboundController = InboundController = __decorate([
    (0, swagger_1.ApiTags)('inventory-in'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('inventory/in'),
    __param(0, (0, typeorm_1.InjectRepository)(inbound_entity_1.InboundOrder)),
    __param(1, (0, typeorm_1.InjectRepository)(color_fabric_entity_1.ColorFabric)),
    __param(2, (0, typeorm_1.InjectRepository)(inventory_entity_1.Inventory)),
    __param(3, (0, typeorm_1.InjectRepository)(operation_log_entity_1.OperationLog)),
    __param(4, (0, typeorm_1.InjectRepository)(inbound_batch_entity_1.InboundBatch)),
    __param(5, (0, typeorm_1.InjectRepository)(payable_entity_1.Payable)),
    __param(6, (0, typeorm_1.InjectRepository)(tax_invoice_attachment_entity_1.TaxInvoiceAttachment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], InboundController);
//# sourceMappingURL=inbound.controller.js.map