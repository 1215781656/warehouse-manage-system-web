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
import { Payable } from './payable.entity';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AttachmentsService } from '../attachments/attachments.service';

@ApiTags('finance-payable')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance/payable')
export class PayableController {
  constructor(
    @InjectRepository(Payable) private readonly repo: Repository<Payable>,
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
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.inboundOrder', 'in')
      .leftJoinAndSelect('in.colorFabric', 'cf')
      .where('p.deletedAt IS NULL');
    if (customer) qb.andWhere('p.supplier LIKE :c', { c: `%${customer}%` });
    if (startDate || endDate) {
      const { start, end } = clipToDate(startDate, endDate);
      if (start) qb.andWhere('in.inboundDate >= :sd', { sd: start });
      if (end) qb.andWhere('in.inboundDate <= :ed', { ed: end });
    }
    const total = await qb.getCount();
    const rows = await qb
      .orderBy('in.inboundDate', 'DESC')
      .skip((p - 1) * ps)
      .take(ps)
      .getMany();
    const list = rows.map((p: any) => {
      const ino = p.inboundOrder || {};
      const cf = ino.colorFabric || {};
      const inboundDateStr = String(
        ino.inboundDate || p.inboundDate || '',
      ).substring(0, 10);
      const payableAmount = Number(
        (
          (p.payableAmount
            ? Number(p.payableAmount)
            : Number(ino.amount || 0)) || 0
        ).toFixed(2),
      );
      const paidAmount = Number(Number(p.paidAmount || 0).toFixed(2));
      const unpaidAmount = Number(
        (p.unpaidAmount !== undefined && p.unpaidAmount !== null
          ? Number(p.unpaidAmount)
          : payableAmount - paidAmount
        ).toFixed(2),
      );

      // Mappings
      return {
        id: p.id,
        inboundDate: inboundDateStr,
        inboundNo: ino.inboundNo || p.inboundNo,
        supplier: p.supplier || ino.supplier,

        // New fields
        code: p.code || cf.colorFabricNo || '',
        productSpec: p.productSpec || cf.productSpec || '',
        composition: p.composition || cf.composition || '',
        color: p.color || cf.color || '',
        craft: p.craft || '',
        fabricWeight: p.fabricWeight || cf.weight || '',
        customerRemark: p.customerRemark || '',
        pieceCount: p.pieceCount !== null ? p.pieceCount : ino.quantity || 0,
        totalWeight: Number(
          p.totalWeight !== null ? p.totalWeight : ino.weightKg || 0,
        ),
        unitPrice: Number(
          p.unitPrice !== null ? p.unitPrice : ino.unitPrice || 0,
        ),

        quantity: Number(ino.quantity || 0), // backward compat
        weightKg: Number(ino.weightKg || 0), // backward compat

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
    if (customer) sumQb.andWhere('p.supplier LIKE :c', { c: `%${customer}%` });
    if (startDate || endDate) {
      const { start, end } = clipToDate(startDate, endDate);
      if (start) sumQb.andWhere('in.inboundDate >= :sd', { sd: start });
      if (end) sumQb.andWhere('in.inboundDate <= :ed', { ed: end });
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
        taxInvoiceTotal: Number(
          Number(sumRaw?.taxInvoiceTotal || 0).toFixed(2),
        ),
      },
    };
    const globalSummary = {
      payable: {
        totalPayable: Number(
          Number(globalSumRaw?.totalPayable || 0).toFixed(2),
        ),
        totalPaid: Number(Number(globalSumRaw?.totalPaid || 0).toFixed(2)),
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
  async create(@Body() dto: Partial<Payable>) {
    const entity = this.repo.create({
      inboundOrder: (dto as any).inboundOrder,
      inboundDate:
        String((dto as any).inboundDate || '').substring(0, 10) || null,
      inboundNo: String((dto as any).inboundNo || '') || null,
      supplier: String(dto.supplier || ''),

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

      payableAmount: String(dto.payableAmount || '0'),
      paidAmount: String(dto.paidAmount || '0'),
      unpaidAmount: String(
        (Number(dto.payableAmount || 0) - Number(dto.paidAmount || 0)).toFixed(
          2,
        ),
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
    const p = await this.repo.findOne({
      where: { id },
      relations: ['inboundOrder', 'inboundOrder.colorFabric'],
    });
    if (!p) return null;
    const ino = p.inboundOrder || ({} as any);
    const cf = (ino as any).colorFabric || {};
    const taxAttachments = await this.attachments.listTaxByRef(id);
    const otherAttachments = await this.attachments.listOtherByRef(id);
    const base = process.env.FILE_BASE || '';
    const mapPath = (pa: string) => (base ? `${base}${pa}` : pa);
    return {
      id: p.id,
      inboundDate: String(ino.inboundDate || p.inboundDate || '').substring(
        0,
        10,
      ),
      inboundNo: ino.inboundNo || p.inboundNo,
      supplier: p.supplier || ino.supplier,

      // Priority Logic
      code: p.code || cf.colorFabricNo || '',
      colorNo: cf.colorNo || '',
      batchNo: cf.batchNo || '',
      productSpec: p.productSpec || (cf as any).productSpec || '',
      composition: p.composition || (cf as any).composition || '',
      color: p.color || (cf as any).color || '',
      craft: p.craft || '',
      fabricWeight: p.fabricWeight || (cf as any).weight || '',
      customerRemark: p.customerRemark || '',
      pieceCount: p.pieceCount !== null ? p.pieceCount : ino.quantity || 0,
      totalWeight: Number(
        p.totalWeight !== null ? p.totalWeight : ino.weightKg || 0,
      ),
      unitPrice: Number(
        p.unitPrice !== null ? p.unitPrice : ino.unitPrice || 0,
      ),

      payableAmount: Number(p.payableAmount || 0),
      paidAmount: Number(p.paidAmount || 0),
      unpaidAmount: Number(p.unpaidAmount || 0),
      taxInvoiceAmount: Number(p.taxInvoiceAmount || 0),
      remark: (p as any).remark,
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
  async update(@Param('id') id: string, @Body() dto: Partial<Payable>) {
    const patch: Partial<Payable> = {};
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
      const v = (dto as any)[k];
      if (v !== undefined) (patch as any)[k] = v;
    });
    if ((dto as any).inboundDate !== undefined) {
      (patch as any).inboundDate = String(
        (dto as any).inboundDate || '',
      ).substring(0, 10);
    }
    if ((dto as any).deletedAt !== undefined)
      (patch as any).deletedAt = new Date(String((dto as any).deletedAt));
    if (
      (dto as any).payableAmount !== undefined ||
      (dto as any).paidAmount !== undefined
    ) {
      const existing = await this.repo.findOne({ where: { id } });
      const rec =
        (dto as any).payableAmount !== undefined
          ? Number((dto as any).payableAmount)
          : Number(existing?.payableAmount || 0);
      const got =
        (dto as any).paidAmount !== undefined
          ? Number((dto as any).paidAmount)
          : Number(existing?.paidAmount || 0);
      (patch as any).unpaidAmount = String((rec - got).toFixed(2));
    }
    (patch as any).updatedAt = new Date();
    await this.repo.update({ id }, patch as any);
    return await this.repo.findOne({
      where: { id },
      relations: ['inboundOrder'],
    });
  }
}
