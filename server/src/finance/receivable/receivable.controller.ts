import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { clipToDate } from '../../utils/date-range';
import { Receivable } from './receivable.entity';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AttachmentsService } from '../attachments/attachments.service';

@ApiTags('finance-receivable')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance/receivable')
export class ReceivableController {
  constructor(
    @InjectRepository(Receivable) private readonly repo: Repository<Receivable>,
    private readonly attachments: AttachmentsService,
  ) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('customer') customer?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const p = Math.max(1, Number(page || 1));
    const ps = Math.max(1, Math.min(200, Number(pageSize || 10)));
    const qb = this.repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.outboundOrder', 'out')
      .leftJoinAndSelect('out.colorFabric', 'cf')
      .where('r.deletedAt IS NULL');
    if (customer) qb.andWhere('r.customer LIKE :c', { c: `%${customer}%` });
    if (startDate || endDate) {
      const { start, end } = clipToDate(startDate, endDate);
      if (start) qb.andWhere('out.outboundDate >= :sd', { sd: start });
      if (end) qb.andWhere('out.outboundDate <= :ed', { ed: end });
    }
    const total = await qb.getCount();
    const rows = await qb
      .orderBy('out.outboundDate', 'DESC')
      .skip((p - 1) * ps)
      .take(ps)
      .getMany();
    const list = rows.map((r: any) => {
      const out = r.outboundOrder || {};
      const cf = out.colorFabric || {};
      const outboundDateStr = String(
        out.outboundDate || r.outboundDate || '',
      ).substring(0, 10);
      const receivableAmount = Number(
        (
          (r.receivableAmount
            ? Number(r.receivableAmount)
            : Number(out.amount || 0)) || 0
        ).toFixed(2),
      );
      const receivedAmount = Number(Number(r.receivedAmount || 0).toFixed(2));
      const unpaidAmount = Number(
        (r.unpaidAmount !== undefined && r.unpaidAmount !== null
          ? Number(r.unpaidAmount)
          : receivableAmount - receivedAmount
        ).toFixed(2),
      );

      // Mapping fields with priority: Manual > Sync (Outbound) > Sync (ColorFabric)
      return {
        id: r.id,
        outboundDate: outboundDateStr,
        outboundNo: out.outboundNo || r.outboundNo,
        deliveryNo: out.deliveryNo || r.deliveryNo,
        customer: r.customer || out.customer,

        // New fields with priority logic
        code: r.code || out.code || '',
        productSpec: r.productSpec || cf.productSpec || '',
        composition: r.composition || out.composition || cf.composition || '',
        color: r.color || out.color || cf.color || '',
        craft: r.craft || out.process || '',
        fabricWeight: r.fabricWeight || out.gramWeight || cf.weight || '',
        customerRemark: r.customerRemark || out.customerNote || '',
        pieceCount: r.pieceCount !== null ? r.pieceCount : out.quantity || 0,
        totalWeight: Number(
          r.totalWeight !== null ? r.totalWeight : out.weightKg || 0,
        ),
        unitPrice: Number(
          r.unitPrice !== null ? r.unitPrice : out.unitPrice || 0,
        ),

        quantity: Number(out.quantity || 0), // Keeping original for backward compat if needed
        weightKg: Number(out.weightKg || 0), // Keeping original for backward compat if needed

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
    if (customer) sumQb.andWhere('r.customer LIKE :c', { c: `%${customer}%` });
    if (startDate || endDate) {
      const { start, end } = clipToDate(startDate, endDate);
      if (start) sumQb.andWhere('out.outboundDate >= :sd', { sd: start });
      if (end) sumQb.andWhere('out.outboundDate <= :ed', { ed: end });
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
        totalReceivable: Number(
          Number(sumRaw?.totalReceivable || 0).toFixed(2),
        ),
        totalReceived: Number(Number(sumRaw?.totalReceived || 0).toFixed(2)),
        totalUnpaid: Number(Number(sumRaw?.totalUnpaid || 0).toFixed(2)),
        taxInvoiceTotal: Number(
          Number(sumRaw?.taxInvoiceTotal || 0).toFixed(2),
        ),
      },
    };
    const globalSummary = {
      receivable: {
        totalReceivable: Number(
          Number(globalSumRaw?.totalReceivable || 0).toFixed(2),
        ),
        totalReceived: Number(
          Number(globalSumRaw?.totalReceived || 0).toFixed(2),
        ),
        totalUnpaid: Number(Number(globalSumRaw?.totalUnpaid || 0).toFixed(2)),
        taxInvoiceTotal: Number(
          Number(globalSumRaw?.taxInvoiceTotal || 0).toFixed(2),
        ),
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

  @Post()
  async create(@Body() dto: Partial<Receivable>) {
    const entity = this.repo.create({
      outboundOrder: (dto as any).outboundOrder,
      outboundDate:
        String((dto as any).outboundDate || '').substring(0, 10) || null,
      outboundNo: String((dto as any).outboundNo || '') || null,
      deliveryNo: String((dto as any).deliveryNo || '') || null,
      customer: String(dto.customer || ''),

      // New fields
      code: dto.code,
      productSpec: String((dto as any).productSpec || '') || null,
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
      unpaidAmount: String(
        (
          Number(dto.receivableAmount || 0) - Number(dto.receivedAmount || 0)
        ).toFixed(2),
      ),
      taxInvoiceAmount: String(dto.taxInvoiceAmount || '0'),
      source: String(dto.source || 'manual'),
      sourceId: String(dto.sourceId || ''),
      remark: String((dto as any).remark || ''),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    const saved = await this.repo.save(entity);
    return saved;
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const r = await this.repo.findOne({
      where: { id },
      relations: ['outboundOrder', 'outboundOrder.colorFabric'],
    });
    if (!r) return null;
    const out = r.outboundOrder || ({} as any);
    const cf = (out as any).colorFabric || {};
    const taxAttachments = await this.attachments.listTaxByRef(id);
    const otherAttachments = await this.attachments.listOtherByRef(id);
    const base = process.env.FILE_BASE || '';
    const mapPath = (p: string) => (base ? `${base}${p}` : p);

    return {
      id: r.id,
      outboundDate: String(out.outboundDate || r.outboundDate || '').substring(
        0,
        10,
      ),
      outboundNo: out.outboundNo || r.outboundNo,
      customer: r.customer || out.customer,

      // Priority Logic
      code: r.deliveryNo || r.code || out.deliveryNo || out.code || '',
      deliveryNo: r.deliveryNo || r.code || out.deliveryNo || '',
      productSpec: r.productSpec || (cf as any).productSpec || '',
      composition:
        r.composition || out.composition || (cf as any).composition || '',
      color: r.color || out.color || (cf as any).color || '',
      craft: r.craft || out.process || '',
      fabricWeight:
        r.fabricWeight || out.gramWeight || (cf as any).weight || '',
      customerRemark: r.customerRemark || out.customerNote || '',
      pieceCount: r.pieceCount !== null ? r.pieceCount : out.quantity || 0,
      totalWeight: Number(
        r.totalWeight !== null ? r.totalWeight : out.weightKg || 0,
      ),
      unitPrice: Number(
        r.unitPrice !== null ? r.unitPrice : out.unitPrice || 0,
      ),

      receivableAmount: Number(r.receivableAmount || 0),
      receivedAmount: Number(r.receivedAmount || 0),
      unpaidAmount: Number(r.unpaidAmount || 0),
      taxInvoiceAmount: Number(r.taxInvoiceAmount || 0),
      remark: (r as any).remark,
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

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<Receivable>) {
    const patch: Partial<Receivable> = {};
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
      const v = (dto as any)[k];
      if (v !== undefined) (patch as any)[k] = v;
    });
    if ((dto as any).outboundDate !== undefined) {
      (patch as any).outboundDate = String(
        (dto as any).outboundDate || '',
      ).substring(0, 10);
    }
    if ((dto as any).deletedAt !== undefined)
      (patch as any).deletedAt = new Date(String((dto as any).deletedAt));
    if (
      (dto as any).receivableAmount !== undefined ||
      (dto as any).receivedAmount !== undefined
    ) {
      const existing = await this.repo.findOne({ where: { id } });
      const rec =
        (dto as any).receivableAmount !== undefined
          ? Number((dto as any).receivableAmount)
          : Number(existing?.receivableAmount || 0);
      const got =
        (dto as any).receivedAmount !== undefined
          ? Number((dto as any).receivedAmount)
          : Number(existing?.receivedAmount || 0);
      (patch as any).unpaidAmount = String((rec - got).toFixed(2));
    }
    (patch as any).updatedAt = new Date();
    await this.repo.update({ id }, patch as any);
    return await this.repo.findOne({
      where: { id },
      relations: ['outboundOrder'],
    });
  }
}
