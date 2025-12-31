import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InboundOrder } from './inbound.entity';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ColorFabric } from '../fabric/color-fabric.entity';
import { Inventory } from '../stock/inventory.entity';
import { OperationLog } from '../../system/operation-log.entity';
import { InboundBatch } from './inbound-batch.entity';
import { clipToDate } from '../../utils/date-range';
import { Payable } from '../../finance/payable/payable.entity';
import { TaxInvoiceAttachment } from '../../finance/attachments/tax-invoice-attachment.entity';

@ApiTags('inventory-in')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory/in')
export class InboundController {
  constructor(
    @InjectRepository(InboundOrder)
    private readonly repo: Repository<InboundOrder>,
    @InjectRepository(ColorFabric)
    private readonly fabricRepo: Repository<ColorFabric>,
    @InjectRepository(Inventory)
    private readonly invRepo: Repository<Inventory>,
    @InjectRepository(OperationLog)
    private readonly logRepo: Repository<OperationLog>,
    @InjectRepository(InboundBatch)
    private readonly batchRepo: Repository<InboundBatch>,
    @InjectRepository(Payable)
    private readonly payableRepo: Repository<Payable>,
    @InjectRepository(TaxInvoiceAttachment)
    private readonly attRepo: Repository<TaxInvoiceAttachment>,
  ) {}

  @Get()
  async list(
    @Query('supplier') supplier?: string,
    @Query('colorNo') colorNo?: string,
    @Query('keyword') keyword?: string,
    @Query('inboundNo') inboundNo?: string,
    @Query('productSpec') productSpec?: string,
    @Query('composition') composition?: string,
    @Query('dateStart') dateStart?: string,
    @Query('dateEnd') dateEnd?: string,
  ) {
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
      qb.andWhere(
        '(in.inboundNo LIKE :kw OR cf.productSpec LIKE :kw OR cf.color LIKE :kw)',
        { kw: `%${keyword}%` },
      );
    }
    if (dateStart || dateEnd) {
      const { start, end } = clipToDate(dateStart, dateEnd);
      if (start) qb.andWhere('in.inboundDate >= :start', { start });
      if (end) qb.andWhere('in.inboundDate <= :end', { end });
    }
    return qb.orderBy('in.inboundDate', 'DESC').getMany();
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const order = await this.repo.findOne({
      where: { id },
      relations: ['colorFabric'],
    });
    if (!order) return null;
    const taxAttachments = await this.attRepo.find({
      where: { refId: id },
      order: { uploadedAt: 'DESC' },
    });
    return { ...order, taxAttachments };
  }
  @Post()
  async create(@Body() dto: Partial<InboundOrder>) {
    if (dto.unitPrice && dto.weightKg && !dto.amount) {
      const amount = Number(dto.unitPrice) * Number(dto.weightKg);
      dto.amount = amount.toFixed(2);
    }
    let fabric = (dto as any).colorFabric as ColorFabric;
    if (!fabric) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const serial = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
      const colorFabricNo = `CB_${year}${month}_${serial}`;
      fabric = this.fabricRepo.create({
        colorFabricNo,
        productSpec: (dto as any).productSpec,
        composition: (dto as any).composition,
        weight: Number((dto as any).weight || 0),
        width: Number((dto as any).width || 0),
        color: (dto as any).color,
        colorNo: (dto as any).colorNo,
        batchNo: (dto as any).batchNo,
      });
      fabric = await this.fabricRepo.save(fabric);
    }
    const entity = this.repo.create({
      inboundNo: (dto as any).inboundNo,
      inboundDate: ((dto as any).inboundDate || '').substring(0, 10),
      supplier: (dto as any).supplier,
      quantity: Number((dto as any).quantity || 0),
      weightKg: (dto as any).weightKg,
      unitPrice: (dto as any).unitPrice,
      amount: (dto as any).amount,
      operator: (dto as any).operator,
      colorFabric: fabric,
    } as any);
    const saved = (await this.repo.save(entity as any)) as InboundOrder;
    let inv = await this.invRepo.findOne({
      where: { colorFabric: { id: fabric.id } },
      relations: ['colorFabric'],
    });
    if (!inv) {
      inv = this.invRepo.create({ colorFabric: fabric });
    }
    inv.totalInboundQuantity =
      (inv.totalInboundQuantity || 0) + Number((dto as any).quantity || 0);
    inv.totalInboundWeight = (
      Number(inv.totalInboundWeight || 0) + Number((dto as any).weightKg || 0)
    ).toFixed(2) as any;
    inv.currentQuantity =
      (inv.totalInboundQuantity || 0) - (inv.totalOutboundQuantity || 0);
    inv.currentWeight = (
      Number(inv.totalInboundWeight || 0) - Number(inv.totalOutboundWeight || 0)
    ).toFixed(2) as any;
    await this.invRepo.save(inv);
    await this.logRepo.save(
      this.logRepo.create({
        module: 'inventory-in',
        action: 'create',
        refId: saved.id,
        operator: (dto as any).operator || 'unknown',
        detail: JSON.stringify({ dto }),
      }),
    );
    await this.payableRepo.save(
      this.payableRepo.create({
        inboundOrder: saved as any,
        supplier: String((dto as any).supplier || ''),
        payableAmount: String((dto as any).amount || '0'),
        paidAmount: String(0),
        unpaidAmount: String(Number((dto as any).amount || 0).toFixed(2)),
        taxInvoiceAmount: String(0),
        source: 'inbound',
        sourceId: saved.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any),
    );
    return saved;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<InboundOrder>) {
    return this.repo.manager.transaction(async (manager) => {
      const repo = manager.getRepository(InboundOrder);
      const invRepo = manager.getRepository(Inventory);
      const fabricRepo = manager.getRepository(ColorFabric);
      const logRepo = manager.getRepository(OperationLog);
      const existing = await repo.findOne({
        where: { id },
        relations: ['colorFabric'],
      });
      if (!existing) return null as any;
      const oldQty = Number(existing.quantity || 0);
      const oldWeight = Number(existing.weightKg || 0);
      if (dto.unitPrice && dto.weightKg && !dto.amount) {
        const amount = Number(dto.unitPrice) * Number(dto.weightKg);
        dto.amount = amount.toFixed(2);
      }
      // update fabric fields if provided
      const fabric = existing.colorFabric;
      const fabricPatch: Partial<ColorFabric> = {};
      [
        'productSpec',
        'composition',
        'weight',
        'width',
        'color',
        'colorNo',
        'batchNo',
      ].forEach((k) => {
        const v = (dto as any)[k];
        if (v !== undefined) (fabricPatch as any)[k] = v;
      });
      if (Object.keys(fabricPatch).length) {
        await fabricRepo.update({ id: fabric.id }, fabricPatch as any);
      }
      const patch: Partial<InboundOrder> = {};
      ['inboundNo', 'supplier', 'unitPrice', 'amount', 'operator'].forEach(
        (k) => {
          const v = (dto as any)[k];
          if (v !== undefined) (patch as any)[k] = v;
        },
      );
      if ((dto as any).inboundDate !== undefined) {
        (patch as any).inboundDate = String((dto as any).inboundDate).substring(
          0,
          10,
        );
      }
      if ((dto as any).quantity !== undefined) {
        (patch as any).quantity = Number((dto as any).quantity || 0);
      }
      if ((dto as any).weightKg !== undefined) {
        (patch as any).weightKg = (dto as any).weightKg;
      }
      await repo.update({ id }, patch as any);
      const updated = await repo.findOne({
        where: { id },
        relations: ['colorFabric'],
      });
      const newQty = Number(updated?.quantity || 0);
      const newWeight = Number(updated?.weightKg || 0);
      // adjust inventory
      const inv = await invRepo.findOne({
        where: { colorFabric: { id: fabric.id } },
        relations: ['colorFabric'],
      });
      if (inv) {
        inv.totalInboundQuantity =
          Number(inv.totalInboundQuantity || 0) - oldQty + newQty;
        inv.totalInboundWeight = (
          Number(inv.totalInboundWeight || 0) -
          oldWeight +
          newWeight
        ).toFixed(2) as any;
        inv.currentQuantity =
          (inv.totalInboundQuantity || 0) - (inv.totalOutboundQuantity || 0);
        inv.currentWeight = (
          Number(inv.totalInboundWeight || 0) -
          Number(inv.totalOutboundWeight || 0)
        ).toFixed(2) as any;
        await invRepo.save(inv);
      }
      await logRepo.save(
        logRepo.create({
          module: 'inventory-in',
          action: 'update',
          refId: id,
          operator: (dto as any).operator || 'unknown',
          detail: JSON.stringify({
            before: { quantity: oldQty, weightKg: oldWeight },
            after: { quantity: newQty, weightKg: newWeight },
          }),
        }),
      );
      return updated;
    });
  }

  @Delete(':id')
  async softDelete(@Param('id') id: string, @Body() body: any) {
    return this.repo.manager.transaction(async (manager) => {
      const repo = manager.getRepository(InboundOrder);
      const invRepo = manager.getRepository(Inventory);
      const logRepo = manager.getRepository(OperationLog);
      const existing = await repo.findOne({
        where: { id },
        relations: ['colorFabric'],
      });
      if (!existing) return null as any;
      // soft delete
      await repo.update({ id }, { deletedAt: new Date() } as any);
      const payRepo = manager.getRepository(Payable);
      const payable = await payRepo.findOne({
        where: { inboundOrder: { id } } as any,
      });
      if (payable) {
        await payRepo.update({ id: payable.id }, {
          deletedAt: new Date(),
        } as any);
      }
      // delete inventory record linked by color_fabric_id
      const inv = await invRepo.findOne({
        where: { colorFabric: { id: existing.colorFabric.id } },
        relations: ['colorFabric'],
      });
      if (inv) {
        await invRepo.delete({ id: inv.id });
      }
      await logRepo.save(
        logRepo.create({
          module: 'inventory-in',
          action: 'delete',
          refId: id,
          operator: body?.operator || 'unknown',
          detail: JSON.stringify({
            record: { id, inboundNo: existing.inboundNo },
          }),
        }),
      );
      return { success: true };
    });
  }

  @Get('batch/:id')
  async batchDetail(@Param('id') id: string) {
    const batch = await this.batchRepo.findOne({ where: { id } });
    if (!batch) return null as any;
    const items = await this.repo.find({
      where: { batch: { id } } as any,
      relations: ['colorFabric', 'batch'],
      order: { createdAt: 'ASC' } as any,
    });
    const itemsWithAttachments = await Promise.all(
      items.map(async (it) => {
        const taxAttachments = await this.attRepo.find({
          where: { refId: it.id },
          order: { uploadedAt: 'DESC' },
        });
        return { ...it, taxAttachments };
      }),
    );
    return { batch, items: itemsWithAttachments };
  }

  @Post('batch')
  async createBatch(
    @Body()
    body: {
      batch: Partial<InboundBatch>;
      items: Array<
        Partial<
          InboundOrder & {
            colorFabric?: Partial<ColorFabric>;
            colorFabricId?: string;
          }
        >
      >;
    },
  ) {
    return this.repo.manager.transaction(async (manager) => {
      if (
        !body?.batch?.inboundNo ||
        !body?.batch?.supplier ||
        !body?.batch?.inboundDate
      ) {
        throw new BadRequestException('批次信息不完整');
      }
      if (!body?.items?.length) {
        throw new BadRequestException('至少需要一条色布明细');
      }
      const batchRepo = manager.getRepository(InboundBatch);
      const fabricRepo = manager.getRepository(ColorFabric);
      const inRepo = manager.getRepository(InboundOrder);
      const invRepo = manager.getRepository(Inventory);
      const logRepo = manager.getRepository(OperationLog);
      const b = batchRepo.create({
        inboundNo: String(body.batch.inboundNo || ''),
        inboundDate: String(body.batch.inboundDate || '').substring(0, 10),
        supplier: String(body.batch.supplier || ''),
        operator: String(body.batch.operator || 'unknown'),
      } as any);
      const savedBatch: InboundBatch = (await batchRepo.save(b as any)) as any;
      const createdItems: InboundOrder[] = [];
      let totalAmount = 0;
      for (const it of body.items || []) {
        let fabric: ColorFabric | null = null;
        if (it.colorFabricId) {
          fabric = await fabricRepo.findOne({
            where: { id: it.colorFabricId },
          });
        }
        if (!fabric) {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const serial = String(Math.floor(Math.random() * 10000)).padStart(
            4,
            '0',
          );
          const colorFabricNo = `CB_${year}${month}_${serial}`;
          fabric = fabricRepo.create({
            colorFabricNo,
            productSpec: (it as any).productSpec,
            composition: (it as any).composition,
            weight: Number((it as any).weight || 0),
            width: Number((it as any).width || 0),
            color: (it as any).color,
            colorNo: (it as any).colorNo,
            batchNo: (it as any).batchNo,
          });
          fabric = await fabricRepo.save(fabric);
        }
        let amount: any = (it as any).amount;
        if (!amount && it.unitPrice && it.weightKg) {
          amount = (Number(it.unitPrice) * Number(it.weightKg)).toFixed(2);
        }
        totalAmount += Number(amount || 0);
        const entity = inRepo.create({
          id: (it as any).id,
          inboundNo: String(body.batch.inboundNo || ''),
          inboundDate: String(body.batch.inboundDate || '').substring(0, 10),
          supplier: String(body.batch.supplier || ''),
          quantity: Number((it as any).quantity || 0),
          weightKg: (it as any).weightKg,
          unitPrice: (it as any).unitPrice,
          amount,
          operator: String(body.batch.operator || 'unknown'),
          colorFabric: fabric!,
          batch: savedBatch,
        } as any);
        const savedOrder = await inRepo.save(entity as any);
        createdItems.push(savedOrder);
        let inv = await invRepo.findOne({
          where: { colorFabric: { id: fabric!.id } },
          relations: ['colorFabric'],
        });
        if (!inv) {
          inv = invRepo.create({ colorFabric: fabric! });
        }
        inv.totalInboundQuantity =
          (inv.totalInboundQuantity || 0) + Number((it as any).quantity || 0);
        inv.totalInboundWeight = (
          Number(inv.totalInboundWeight || 0) +
          Number((it as any).weightKg || 0)
        ).toFixed(2) as any;
        inv.currentQuantity =
          (inv.totalInboundQuantity || 0) - (inv.totalOutboundQuantity || 0);
        inv.currentWeight = (
          Number(inv.totalInboundWeight || 0) -
          Number(inv.totalOutboundWeight || 0)
        ).toFixed(2) as any;
        await invRepo.save(inv);
      }
      await logRepo.save(
        logRepo.create({
          module: 'inventory-in',
          action: 'create-batch',
          refId: savedBatch.id,
          operator: String(body.batch.operator || 'unknown'),
          detail: JSON.stringify({
            batch: body.batch,
            count: (body.items || []).length,
          }),
        }),
      );
      // create payable for each created item
      const payRepo = manager.getRepository(Payable);
      for (const ord of createdItems) {
        const amt = Number((ord as any).amount || 0);
        await payRepo.save(
          payRepo.create({
            inboundOrder: ord as any,
            supplier: String((ord as any).supplier || ''),
            payableAmount: String(amt.toFixed(2)),
            paidAmount: String(0),
            unpaidAmount: String(amt.toFixed(2)),
            taxInvoiceAmount: String(0),
            source: 'inbound',
            sourceId: String((ord as any).id),
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any),
        );
      }
      return {
        batch: savedBatch,
        items: createdItems,
        totalAmount: Number(totalAmount.toFixed(2)),
      };
    });
  }

  @Put('batch/:id')
  async updateBatch(
    @Param('id') id: string,
    @Body()
    body: {
      batch: Partial<InboundBatch>;
      items: Array<
        Partial<
          InboundOrder & {
            id?: string;
            colorFabric?: Partial<ColorFabric>;
            colorFabricId?: string;
          }
        >
      >;
    },
  ) {
    return this.repo.manager.transaction(async (manager) => {
      if (!body?.items) body.items = [];
      const batchRepo = manager.getRepository(InboundBatch);
      const fabricRepo = manager.getRepository(ColorFabric);
      const inRepo = manager.getRepository(InboundOrder);
      const invRepo = manager.getRepository(Inventory);
      const logRepo = manager.getRepository(OperationLog);
      const existingBatch = await batchRepo.findOne({ where: { id } });
      if (!existingBatch) return null as any;
      // update batch shared fields
      const patch: Partial<InboundBatch> = {};
      ['inboundNo', 'supplier', 'operator'].forEach((k) => {
        const v = (body.batch as any)[k];
        if (v !== undefined) (patch as any)[k] = v;
      });
      if ((body.batch as any).inboundDate !== undefined) {
        (patch as any).inboundDate = String(
          (body.batch as any).inboundDate,
        ).substring(0, 10);
      }
      if (Object.keys(patch).length) {
        await batchRepo.update({ id }, patch as any);
      }
      const beforeItems = await inRepo.find({
        where: { batch: { id } } as any,
        relations: ['colorFabric', 'batch'],
      });
      const inputIds = new Set(
        (body.items || [])
          .map((x) => (x.id ? String(x.id) : ''))
          .filter((x) => !!x),
      );
      // remove orders not present
      for (const old of beforeItems) {
        if (!inputIds.has(old.id)) {
          await inRepo.update({ id: old.id }, { deletedAt: new Date() } as any);
          const inv = await invRepo.findOne({
            where: { colorFabric: { id: old.colorFabric.id } },
            relations: ['colorFabric'],
          });
          if (inv) {
            inv.totalInboundQuantity =
              Number(inv.totalInboundQuantity || 0) - Number(old.quantity || 0);
            inv.totalInboundWeight = (
              Number(inv.totalInboundWeight || 0) - Number(old.weightKg || 0)
            ).toFixed(2) as any;
            inv.currentQuantity =
              (inv.totalInboundQuantity || 0) -
              (inv.totalOutboundQuantity || 0);
            inv.currentWeight = (
              Number(inv.totalInboundWeight || 0) -
              Number(inv.totalOutboundWeight || 0)
            ).toFixed(2) as any;
            await invRepo.save(inv);
          }
        }
      }
      // upsert items
      for (const it of body.items || []) {
        let fabric: ColorFabric | null = null;
        if (it.colorFabricId) {
          fabric = await fabricRepo.findOne({
            where: { id: it.colorFabricId },
          });
        }
        if (!fabric) {
          // update fabric fields for existing orders
          if (it.id) {
            const existing = await inRepo.findOne({
              where: { id: it.id } as any,
              relations: ['colorFabric'],
            });
            if (existing) {
              const fp: Partial<ColorFabric> = {};
              [
                'productSpec',
                'composition',
                'weight',
                'width',
                'color',
                'colorNo',
                'batchNo',
              ].forEach((k) => {
                const v = (it as any)[k];
                if (v !== undefined) (fp as any)[k] = v;
              });
              if (Object.keys(fp).length) {
                await fabricRepo.update(
                  { id: existing.colorFabric.id },
                  fp as any,
                );
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
          const serial = String(Math.floor(Math.random() * 10000)).padStart(
            4,
            '0',
          );
          const colorFabricNo = `CB_${year}${month}_${serial}`;
          fabric = fabricRepo.create({
            colorFabricNo,
            productSpec: (it as any).productSpec,
            composition: (it as any).composition,
            weight: Number((it as any).weight || 0),
            width: Number((it as any).width || 0),
            color: (it as any).color,
            colorNo: (it as any).colorNo,
            batchNo: (it as any).batchNo,
          });
          fabric = await fabricRepo.save(fabric);
        }
        let amount: any = (it as any).amount;
        if (!amount && it.unitPrice && it.weightKg) {
          amount = (Number(it.unitPrice) * Number(it.weightKg)).toFixed(2);
        }
        if (it.id) {
          const exist = await inRepo.findOne({ where: { id: it.id } as any });
          if (!exist) continue;
          const oldQty = Number(exist.quantity || 0);
          const oldWeight = Number(exist.weightKg || 0);
          const patchOrder: Partial<InboundOrder> = {
            quantity: Number((it as any).quantity || 0),
            weightKg: (it as any).weightKg,
            unitPrice: (it as any).unitPrice,
            amount,
            colorFabric: fabric!,
          } as any;
          await inRepo.update({ id: it.id }, patchOrder as any);
          const inv = await invRepo.findOne({
            where: { colorFabric: { id: fabric!.id } },
            relations: ['colorFabric'],
          });
          if (inv) {
            inv.totalInboundQuantity =
              Number(inv.totalInboundQuantity || 0) -
              oldQty +
              Number((it as any).quantity || 0);
            inv.totalInboundWeight = (
              Number(inv.totalInboundWeight || 0) -
              oldWeight +
              Number((it as any).weightKg || 0)
            ).toFixed(2) as any;
            inv.currentQuantity =
              (inv.totalInboundQuantity || 0) -
              (inv.totalOutboundQuantity || 0);
            inv.currentWeight = (
              Number(inv.totalInboundWeight || 0) -
              Number(inv.totalOutboundWeight || 0)
            ).toFixed(2) as any;
            await invRepo.save(inv);
          }
        } else {
          const newOrder = inRepo.create({
            inboundNo: String(existingBatch.inboundNo || ''),
            inboundDate: String(existingBatch.inboundDate || '').substring(
              0,
              10,
            ),
            supplier: String(existingBatch.supplier || ''),
            quantity: Number((it as any).quantity || 0),
            weightKg: (it as any).weightKg,
            unitPrice: (it as any).unitPrice,
            amount,
            operator: String(existingBatch.operator || 'unknown'),
            colorFabric: fabric!,
            batch: existingBatch,
          } as any);
          const saved = await inRepo.save(newOrder as any);
          const inv = await invRepo.findOne({
            where: { colorFabric: { id: fabric!.id } },
            relations: ['colorFabric'],
          });
          if (!inv) {
            const newInv = invRepo.create({ colorFabric: fabric! });
            newInv.totalInboundQuantity = Number((it as any).quantity || 0);
            newInv.totalInboundWeight = Number(
              (it as any).weightKg || 0,
            ) as any;
            newInv.currentQuantity =
              (newInv.totalInboundQuantity || 0) -
              (newInv.totalOutboundQuantity || 0);
            newInv.currentWeight = (
              Number(newInv.totalInboundWeight || 0) -
              Number(newInv.totalOutboundWeight || 0)
            ).toFixed(2) as any;
            await invRepo.save(newInv);
          } else {
            inv.totalInboundQuantity =
              (inv.totalInboundQuantity || 0) +
              Number((it as any).quantity || 0);
            inv.totalInboundWeight = (
              Number(inv.totalInboundWeight || 0) +
              Number((it as any).weightKg || 0)
            ).toFixed(2) as any;
            inv.currentQuantity =
              (inv.totalInboundQuantity || 0) -
              (inv.totalOutboundQuantity || 0);
            inv.currentWeight = (
              Number(inv.totalInboundWeight || 0) -
              Number(inv.totalOutboundWeight || 0)
            ).toFixed(2) as any;
            await invRepo.save(inv);
          }
        }
      }
      await logRepo.save(
        logRepo.create({
          module: 'inventory-in',
          action: 'update-batch',
          refId: id,
          operator: String(body.batch?.operator || 'unknown'),
          detail: JSON.stringify({ count: (body.items || []).length }),
        }),
      );
      const batch = await batchRepo.findOne({ where: { id } });
      const items = await inRepo.find({
        where: { batch: { id } } as any,
        relations: ['colorFabric', 'batch'],
      });
      return { batch, items };
    });
  }
}
