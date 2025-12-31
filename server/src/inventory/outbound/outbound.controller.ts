import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Delete,
  UseGuards,
  BadRequestException,
  NotFoundException,
  Query,
  Param,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { clipToDate } from '../../utils/date-range';
import { OutboundOrder } from './outbound.entity';
import { Inventory } from '../stock/inventory.entity';
import { ColorFabric } from '../fabric/color-fabric.entity';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Receivable } from '../../finance/receivable/receivable.entity';
import { TaxInvoiceAttachment } from '../../finance/attachments/tax-invoice-attachment.entity';

@ApiTags('inventory-out')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory/out')
export class OutboundController {
  constructor(
    @InjectRepository(OutboundOrder)
    private readonly repo: Repository<OutboundOrder>,
    @InjectRepository(Inventory)
    private readonly invRepo: Repository<Inventory>,
    @InjectRepository(ColorFabric)
    private readonly fabricRepo: Repository<ColorFabric>,
    @InjectRepository(Receivable)
    private readonly receivableRepo: Repository<Receivable>,
    @InjectRepository(TaxInvoiceAttachment)
    private readonly attRepo: Repository<TaxInvoiceAttachment>,
  ) {}

  @Get()
  async list(
    @Query('customer') customer?: string,
    @Query('outboundNo') outboundNo?: string,
    @Query('deliveryNo') deliveryNo?: string,
    @Query('colorFabricNo') colorFabricNo?: string,
    @Query('productSpec') productSpec?: string,
    @Query('dateStart') dateStart?: string,
    @Query('dateEnd') dateEnd?: string,
  ) {
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
      const { start, end } = clipToDate(dateStart, dateEnd);
      if (start) qb.andWhere('out.outboundDate >= :ds', { ds: start });
      if (end) qb.andWhere('out.outboundDate <= :de', { de: end });
    }
    return qb.orderBy('out.outboundDate', 'DESC').getMany();
  }

  @Post()
  async create(@Body() dto: Partial<OutboundOrder>) {
    if (!dto.consignee) throw new BadRequestException('签收人必填');
    let fabric = (dto as any).colorFabric as ColorFabric;
    if (!fabric && (dto as any).colorFabricId) {
      fabric = (await this.fabricRepo.findOne({
        where: { id: (dto as any).colorFabricId },
      })) as any;
    }
    const inv = await this.invRepo.findOne({
      where: { colorFabric: { id: fabric?.id } },
      relations: ['colorFabric'],
    });
    const rawDetails: Array<string | number> = Array.isArray(
      (dto as any).outboundDetails,
    )
      ? (dto as any).outboundDetails
      : [];
    const detailsArr: number[] = rawDetails.map(Number);
    if (detailsArr.length) {
      if (
        !detailsArr.every(
          (n: number) => Number.isFinite(n) && n > 0 && n <= 1000,
        )
      ) {
        throw new BadRequestException('重量明细需为正数');
      }
      (dto as any).quantity = detailsArr.length;
      (dto as any).weightKg = detailsArr
        .reduce((a: number, b: number) => a + Number(b || 0), 0)
        .toFixed(2);
    }
    if (
      (dto as any).quantity !== undefined &&
      detailsArr.length &&
      Number((dto as any).quantity) !== detailsArr.length
    ) {
      throw new BadRequestException('匹数需与明细数量一致');
    }
    if (inv && inv.currentQuantity < Number(dto.quantity || 0)) {
      throw new BadRequestException('库存不足');
    }
    if (dto.unitPrice && dto.weightKg && !dto.amount) {
      const amount = Number(dto.unitPrice) * Number(dto.weightKg);
      dto.amount = amount.toFixed(2);
    }
    try {
      const entity = this.repo.create({
        outboundNo: (dto as any).outboundNo,
        code: (dto as any).code,
        outboundDate: String((dto as any).outboundDate || '').substring(0, 10),
        customer: (dto as any).customer,
        quantity: Number((dto as any).quantity || 0),
        weightKg: (dto as any).weightKg,
        outboundDetails: detailsArr.length ? detailsArr : null,
        unitPrice: (dto as any).unitPrice,
        amount: (dto as any).amount,
        consignee: (dto as any).consignee,
        deliveryNo: (dto as any).deliveryNo,
        colorFabric: fabric as any,
        composition: (dto as any).composition,
        color: (dto as any).color,
        process: (dto as any).process,
        gramWeight: (dto as any).gramWeight,
        customerNote: (dto as any).customerNote,
        remark: (dto as any).remark,
      } as any);
      const saved: OutboundOrder = await this.repo.save(entity as any);
      if (inv) {
        inv.totalOutboundQuantity =
          (inv.totalOutboundQuantity || 0) + Number((dto as any).quantity || 0);
        inv.totalOutboundWeight = (
          Number(inv.totalOutboundWeight || 0) +
          Number((dto as any).weightKg || 0)
        ).toFixed(2) as any;
        inv.currentQuantity =
          (inv.totalInboundQuantity || 0) - (inv.totalOutboundQuantity || 0);
        inv.currentWeight = (
          Number(inv.totalInboundWeight || 0) -
          Number(inv.totalOutboundWeight || 0)
        ).toFixed(2) as any;
        await this.invRepo.save(inv);
      }
      await this.receivableRepo.save(
        this.receivableRepo.create({
          outboundOrder: saved as any,
          customer: String((dto as any).customer || ''),
          receivableAmount: String((dto as any).amount || '0'),
          receivedAmount: String(0),
          unpaidAmount: String(Number((dto as any).amount || 0).toFixed(2)),
          taxInvoiceAmount: String(0),
          source: 'outbound',
          sourceId: saved.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any),
      );
      return saved;
    } catch (e: any) {
      if (e?.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('出库单号或编号重复');
      }
      if (e?.message?.includes('Incorrect date value')) {
        throw new BadRequestException('出货日期格式错误，请选择有效日期');
      }
      throw new BadRequestException(e?.message || '新增出库失败');
    }
  }

  @Post('batch')
  async batchCreate(@Body() body: any) {
    const common = body?.common || {};
    const items = Array.isArray(body?.items) ? body.items : [];
    if (!items.length) throw new BadRequestException('无有效出库项目');
    try {
      return await this.repo.manager.transaction(async (manager) => {
        const repo = manager.getRepository(OutboundOrder);
        const invRepo = manager.getRepository(Inventory);
        const fabricRepo = manager.getRepository(ColorFabric);
        const toInsert: Partial<OutboundOrder>[] = [];
        const invDelta: Record<string, { qty: number; weight: number }> = {};
        const fabricCache: Record<string, ColorFabric> = {};
        for (const item of items) {
          const fabricId = item.colorFabricId;
          if (!fabricId) throw new BadRequestException('色布ID必填');
          let fabric = fabricCache[fabricId];
          if (!fabric) {
            fabric = (await fabricRepo.findOne({
              where: { id: fabricId },
            })) as any;
            if (!fabric) throw new BadRequestException('色布ID无效');
            fabricCache[fabricId] = fabric;
          }
          const inv = await invRepo.findOne({
            where: { colorFabric: { id: fabric.id } },
            relations: ['colorFabric'],
          });
          const rawDetails: Array<string | number> = Array.isArray(
            item.outboundDetails,
          )
            ? item.outboundDetails
            : [];
          const detailsArr: number[] = rawDetails.map(Number);
          if (
            detailsArr.length &&
            !detailsArr.every(
              (n: number) => Number.isFinite(n) && n > 0 && n <= 1000,
            )
          ) {
            throw new BadRequestException('重量明细需为正数');
          }
          const qty = detailsArr.length || Number(item.quantity || 0);
          if (detailsArr.length && qty !== detailsArr.length) {
            throw new BadRequestException('匹数需与明细数量一致');
          }
          const weight = detailsArr.length
            ? detailsArr.reduce((a: number, b: number) => a + b, 0)
            : Number(item.weightKg || 0);
          if (inv && inv.currentQuantity < qty)
            throw new BadRequestException('库存不足');
          const unitPrice = Number(item.unitPrice || 0);
          const amount =
            unitPrice && weight
              ? (unitPrice * Number(weight)).toFixed(2)
              : item.amount;
          toInsert.push({
            id: (item as any).id,
            outboundNo: common.outboundNo,
            code: common.code,
            outboundDate: String(common.outboundDate || '').substring(0, 10),
            customer: common.customer,
            quantity: qty,
            weightKg: weight.toFixed(2) as any,
            outboundDetails: detailsArr.length ? detailsArr : null,
            unitPrice: unitPrice as any,
            amount: amount as any,
            consignee: common.consignee,
            deliveryNo: common.deliveryNo,
            colorFabric: fabric as any,
            composition: item.composition,
            color: item.color,
            process: item.process,
            gramWeight: item.gramWeight,
            customerNote: item.customerNote,
            remark: item.remark,
          } as any);
          const k = fabric.id;
          invDelta[k] = invDelta[k] || { qty: 0, weight: 0 };
          invDelta[k].qty += qty;
          invDelta[k].weight += Number(weight);
        }
        const insertResult = await repo.insert(toInsert as any[]);
        for (const [fid, delta] of Object.entries(invDelta)) {
          const inv = await invRepo.findOne({
            where: { colorFabric: { id: fid } },
            relations: ['colorFabric'],
          });
          if (inv) {
            inv.totalOutboundQuantity =
              Number(inv.totalOutboundQuantity || 0) + delta.qty;
            inv.totalOutboundWeight = (
              Number(inv.totalOutboundWeight || 0) + delta.weight
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
        const ids = insertResult.identifiers?.map((x: any) => x.id) || [];
        const saved = ids.length
          ? await repo.find({
              where: { id: In(ids as any) } as any,
              relations: ['colorFabric'],
            })
          : [];
        const recRepo = manager.getRepository(Receivable);
        for (const ord of saved) {
          const amt = Number((ord as any).amount || 0);
          await recRepo.save(
            recRepo.create({
              outboundOrder: ord as any,
              customer: String((ord as any).customer || ''),
              receivableAmount: String(amt.toFixed(2)),
              receivedAmount: String(0),
              unpaidAmount: String(amt.toFixed(2)),
              taxInvoiceAmount: String(0),
              source: 'outbound',
              sourceId: String((ord as any).id),
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any),
          );
        }
        return { success: true, items: saved };
      });
    } catch (e: any) {
      if (e?.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('出库单号或编号重复');
      }
      if (e?.message?.includes('Incorrect date value')) {
        throw new BadRequestException('出货日期格式错误，请选择有效日期');
      }
      throw new BadRequestException(e?.message || '批量出库失败');
    }
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const r = await this.repo.findOne({
      where: { id },
      relations: ['colorFabric'],
    });
    if (!r) return null as any;
    const taxAttachments = await this.attRepo.find({
      where: { refId: id },
      order: { uploadedAt: 'DESC' },
    });
    return { ...r, taxAttachments };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<OutboundOrder>) {
    return this.repo.manager.transaction(async (manager) => {
      const repo = manager.getRepository(OutboundOrder);
      const invRepo = manager.getRepository(Inventory);
      const existing = await repo.findOne({
        where: { id },
        relations: ['colorFabric'],
      });
      if (!existing) return null as any;

      const patch: Partial<OutboundOrder> = {};

      // Handle colorFabricId change if present
      let newFabricId = existing.colorFabric.id;
      if (
        (dto as any).colorFabricId &&
        (dto as any).colorFabricId !== existing.colorFabric.id
      ) {
        newFabricId = (dto as any).colorFabricId;
        // Verify new fabric exists
        const fabricRepo = manager.getRepository(ColorFabric);
        const newFabric = await fabricRepo.findOne({
          where: { id: newFabricId },
        });
        if (!newFabric) throw new BadRequestException('新的色布ID无效');
        (patch as any).colorFabric = newFabric;
      }

      const oldQty = Number(existing.quantity || 0);
      const oldWeight = Number(existing.weightKg || 0);
      const rawDetails = Array.isArray((dto as any).outboundDetails)
        ? (dto as any).outboundDetails
        : [];
      const detailsArr: number[] = rawDetails.map((x: any) => Number(x));
      if (detailsArr.length) {
        if (
          !detailsArr.every(
            (n: number) => Number.isFinite(n) && n > 0 && n <= 1000,
          )
        ) {
          throw new BadRequestException('重量明细需为正数');
        }
        (dto as any).quantity = detailsArr.length;
        (dto as any).weightKg = detailsArr
          .reduce((a: number, b: number) => a + Number(b || 0), 0)
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
        const v = (dto as any)[k];
        if (v !== undefined) (patch as any)[k] = v;
      });
      if ((dto as any).outboundDate !== undefined) {
        (patch as any).outboundDate = String(
          (dto as any).outboundDate,
        ).substring(0, 10);
      }
      if ((dto as any).quantity !== undefined) {
        (patch as any).quantity = Number((dto as any).quantity || 0);
      }
      if ((dto as any).weightKg !== undefined) {
        (patch as any).weightKg = (dto as any).weightKg;
      }
      if ((dto as any).outboundDetails !== undefined) {
        const arr: number[] = Array.isArray((dto as any).outboundDetails)
          ? ((dto as any).outboundDetails as Array<string | number>).map(Number)
          : [];
        if (
          arr.length &&
          !arr.every((n: number) => Number.isFinite(n) && n > 0 && n <= 1000)
        ) {
          throw new BadRequestException('重量明细需为正数');
        }
        if (arr.length) {
          (patch as any).quantity = arr.length;
          (patch as any).weightKg = arr
            .reduce((a: number, b: number) => a + b, 0)
            .toFixed(2);
          (patch as any).outboundDetails = arr;
        }
      }
      await repo.update({ id }, patch as any);
      const updated = await repo.findOne({
        where: { id },
        relations: ['colorFabric'],
      });
      const newQty = Number(updated?.quantity || 0);
      const newWeight = Number(updated?.weightKg || 0);

      // 1. Rollback old inventory
      const oldInv = await invRepo.findOne({
        where: { colorFabric: { id: existing.colorFabric.id } },
        relations: ['colorFabric'],
      });
      if (oldInv) {
        oldInv.totalOutboundQuantity =
          Number(oldInv.totalOutboundQuantity || 0) - oldQty;
        oldInv.totalOutboundWeight = (
          Number(oldInv.totalOutboundWeight || 0) - oldWeight
        ).toFixed(2) as any;
        oldInv.currentQuantity =
          (oldInv.totalInboundQuantity || 0) -
          (oldInv.totalOutboundQuantity || 0);
        oldInv.currentWeight = (
          Number(oldInv.totalInboundWeight || 0) -
          Number(oldInv.totalOutboundWeight || 0)
        ).toFixed(2) as any;
        await invRepo.save(oldInv);
      }

      // 2. Apply to new inventory (even if same as old)
      const newInv = await invRepo.findOne({
        where: { colorFabric: { id: newFabricId } },
        relations: ['colorFabric'],
      });
      if (newInv) {
        // Check stock if we are increasing usage or switching stock
        // Note: For simplicity, we check if resulting current stock would be negative
        // But since we already deducted from oldInv (if same), we need to be careful.
        // Actually, if it's the same inventory, we effectively did -old +new.
        // If different, we did -old on oldInv, and now +new on newInv.

        // Let's just calculate the new state
        newInv.totalOutboundQuantity =
          Number(newInv.totalOutboundQuantity || 0) + newQty;
        newInv.totalOutboundWeight = (
          Number(newInv.totalOutboundWeight || 0) + newWeight
        ).toFixed(2) as any;

        const newCurrentQty =
          (newInv.totalInboundQuantity || 0) -
          (newInv.totalOutboundQuantity || 0);
        if (newCurrentQty < 0) {
          throw new BadRequestException('修改后库存不足');
        }

        newInv.currentQuantity = newCurrentQty;
        newInv.currentWeight = (
          Number(newInv.totalInboundWeight || 0) -
          Number(newInv.totalOutboundWeight || 0)
        ).toFixed(2) as any;
        await invRepo.save(newInv);
      }

      return updated;
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.repo.manager.transaction(async (manager) => {
      const repo = manager.getRepository(OutboundOrder);
      const invRepo = manager.getRepository(Inventory);
      const existing = await repo.findOne({
        where: { id },
        relations: ['colorFabric'],
      });
      if (!existing) {
        throw new NotFoundException('出库记录不存在');
      }
      const oldQty = Number(existing.quantity || 0);
      const oldWeight = Number(existing.weightKg || 0);
      await repo.delete({ id });
      const recRepo = manager.getRepository(Receivable);
      const receivable = await recRepo.findOne({
        where: { outboundOrder: { id } } as any,
      });
      if (receivable) {
        await recRepo.update({ id: receivable.id }, {
          deletedAt: new Date(),
        } as any);
      }
      const inv = await invRepo.findOne({
        where: { colorFabric: { id: existing.colorFabric.id } },
        relations: ['colorFabric'],
      });
      if (inv) {
        inv.totalOutboundQuantity =
          Number(inv.totalOutboundQuantity || 0) - oldQty;
        inv.totalOutboundWeight = (
          Number(inv.totalOutboundWeight || 0) - oldWeight
        ).toFixed(2) as any;
        inv.currentQuantity =
          (inv.totalInboundQuantity || 0) - (inv.totalOutboundQuantity || 0);
        inv.currentWeight = (
          Number(inv.totalInboundWeight || 0) -
          Number(inv.totalOutboundWeight || 0)
        ).toFixed(2) as any;
        await invRepo.save(inv);
      }
      return { success: true };
    });
  }
}
