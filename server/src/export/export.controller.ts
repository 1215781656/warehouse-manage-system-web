import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
  Res,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ExportService, ExportColumn } from './export.service';
import { Get, Param } from '@nestjs/common';
import * as fs from 'fs';

const pickFilters = (type: string, q: Record<string, any>) => {
  if (type === 'receivable') {
    return {
      customer: q.customer,
      startDate: q.startDate,
      endDate: q.endDate,
    };
  }
  if (type === 'payable') {
    return {
      customer: q.customer,
      startDate: q.startDate,
      endDate: q.endDate,
    };
  }
  if (type === 'inbound') {
    return {
      inboundNo: q.inboundNo,
      supplier: q.supplier,
      productSpec: q.productSpec,
      dateStart: q.dateStart,
      dateEnd: q.dateEnd,
    };
  }
  if (type === 'outbound') {
    return {
      outboundNo: q.outboundNo,
      customer: q.customer,
      productSpec: q.productSpec,
      dateStart: q.dateStart,
      dateEnd: q.dateEnd,
    };
  }
  if (type === 'stock') {
    return {
      productSpec: q.productSpec,
      composition: q.composition,
      weight: q.weight,
      width: q.width,
      color: q.color,
      colorNo: q.colorNo,
    };
  }
  return {};
};

@ApiTags('export')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('export')
export class ExportController {
  constructor(private readonly svc: ExportService) {}

  @Post('excel')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        entity: {
          type: 'string',
          enum: [
            'inbound',
            'outbound',
            'stock',
            'colorFabric',
            'receivable',
            'payable',
          ],
        },
        ids: { type: 'array', items: { type: 'string' } },
        columns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              header: { type: 'string' },
              type: { type: 'string', enum: ['text', 'number', 'date'] },
            },
            required: ['key', 'header'],
          },
        },
        filename: { type: 'string' },
      },
      required: ['entity', 'ids', 'columns'],
    },
  })
  @ApiQuery({
    name: 'async',
    required: false,
    type: Boolean,
    description: '是否使用异步任务',
  })
  async exportExcel(
    @Body()
    body: {
      entity: 'inbound' | 'outbound' | 'stock' | 'colorFabric';
      ids: string[];
      columns: ExportColumn[];
      filename?: string;
    },
    @Query('async') asyncFlag?: string,
    @Res() res?: Response,
  ) {
    const asyncMode = String(asyncFlag || '').toLowerCase() === 'true';
    if (!Array.isArray(body?.ids) || !body.ids.length)
      throw new BadRequestException('ID数组不能为空');
    if (!Array.isArray(body?.columns) || !body.columns.length)
      throw new BadRequestException('列定义不能为空');
    if (!body.entity) throw new BadRequestException('实体类型不能为空');

    if (asyncMode) {
      const task = await this.svc.enqueue(body);
      return res!.json({ taskId: task.id });
    }
    res!.setHeader('Content-Type', 'application/vnd.ms-excel');
    const fn = this.svc.makeFilename(body.filename, body.entity);
    res!.setHeader('Content-Disposition', `attachment; filename="${fn}"`);
    await this.svc.streamExcel(body, res!);
  }

  @Get('tasks/:id/status')
  async taskStatus(@Param('id') id: string) {
    const t = this.svc.getTask(id);
    if (!t) throw new BadRequestException('任务不存在');
    return { state: t.state, progress: t.progress, error: t.error };
  }

  @Get('tasks/:id/download')
  async taskDownload(@Param('id') id: string, @Res() res: Response) {
    const t = this.svc.getTask(id);
    if (!t) throw new BadRequestException('任务不存在');
    if (t.state !== 'finished' || !t.filePath || !fs.existsSync(t.filePath)) {
      throw new BadRequestException('任务未完成或文件不可用');
    }
    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${this.svc.makeFilename(undefined, t.payload.entity)}"`,
    );
    fs.createReadStream(t.filePath).pipe(res);
  }
}

@ApiTags('report')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('report')
export class ReportControllerAlias {
  constructor(private readonly svc: ExportService) {}

  @Get('export/:type')
  @ApiQuery({
    name: 'ids',
    required: false,
    type: [String],
    description: 'ID数组',
  })
  async exportByTypeAlias(
    @Param('type') type: string,
    @Query('ids') ids: string[] | string,
    @Query('ids[]') idsBracket: string[] | string | undefined,
    @Res() res: Response,
    @Query('isAll') isAll?: string,
    @Query('async') asyncFlag?: string,
    @Query() query?: Record<string, any>,
  ) {
    const raw =
      Array.isArray(idsBracket) || typeof idsBracket === 'string'
        ? idsBracket
        : ids;
    const idList = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const asyncMode = String(asyncFlag || '').toLowerCase() === 'true';
    const allFlag = String(isAll || '').toUpperCase() === 'Y';
    const columns: ExportColumn[] =
      type === 'receivable'
        ? [
            { key: 'outboundDate', header: '出货日期', type: 'date' },
            { key: 'outboundNo', header: '货单号' },
            { key: 'deliveryNo', header: '编号' },
            { key: 'customer', header: '客户' },
            { key: 'productSpec', header: '品名规格' },
            { key: 'composition', header: '成分' },
            { key: 'color', header: '颜色' },
            { key: 'craft', header: '工艺' },
            { key: 'fabricWeight', header: '克重' },
            { key: 'customerRemark', header: '客户备注' },
            { key: 'pieceCount', header: '匹数', type: 'number' },
            { key: 'totalWeight', header: '重量', type: 'number' },
            { key: 'unitPrice', header: '单价', type: 'number' },
            { key: 'receivableAmount', header: '应收金额', type: 'number' },
            { key: 'receivedAmount', header: '已收金额', type: 'number' },
            { key: 'taxInvoiceAmount', header: '税票金额', type: 'number' },
            { key: 'unpaidAmount', header: '未收金额', type: 'number' },
            { key: 'remark', header: '备注' },
          ]
        : type === 'payable'
          ? [
              { key: 'inboundDate', header: '入库日期', type: 'date' },
              { key: 'inboundNo', header: '货单编号' },
              { key: 'supplier', header: '供应商' },
              { key: 'productSpec', header: '品名规格' },
              { key: 'composition', header: '成分' },
              { key: 'color', header: '颜色' },
              { key: 'fabricWeight', header: '克重' },
              {
                key: 'inboundOrder.colorFabric.width',
                header: '全幅宽',
                type: 'number',
              },
              { key: 'inboundOrder.colorFabric.colorNo', header: '色号' },
              { key: 'inboundOrder.colorFabric.batchNo', header: '缸号' },
              { key: 'pieceCount', header: '匹数', type: 'number' },
              { key: 'totalWeight', header: '重量', type: 'number' },
              { key: 'unitPrice', header: '单价', type: 'number' },
              { key: 'payableAmount', header: '应付金额', type: 'number' },
              { key: 'paidAmount', header: '已付金额', type: 'number' },
              { key: 'taxInvoiceAmount', header: '税票金额', type: 'number' },
              { key: 'unpaidAmount', header: '未付金额', type: 'number' },
              { key: 'remark', header: '备注' },
            ]
          : type === 'inbound'
            ? [
                { key: 'inboundDate', header: '入库日期', type: 'date' },
                { key: 'inboundNo', header: '货单编号' },
                { key: 'supplier', header: '供应商' },
                { key: 'colorFabric.productSpec', header: '品名规格' },
                { key: 'colorFabric.composition', header: '成分' },
                {
                  key: 'colorFabric.weight',
                  header: '克重(g/m²)',
                  type: 'number',
                },
                {
                  key: 'colorFabric.width',
                  header: '全幅宽(cm)',
                  type: 'number',
                },
                { key: 'colorFabric.color', header: '颜色' },
                { key: 'colorFabric.colorNo', header: '色号' },
                { key: 'colorFabric.batchNo', header: '缸号' },
                { key: 'quantity', header: '匹数', type: 'number' },
                { key: 'weightKg', header: '重量(kg)', type: 'number' },
                { key: 'unitPrice', header: '单价(元)', type: 'number' },
                { key: 'amount', header: '金额(元)', type: 'number' },
              ]
            : type === 'outbound'
              ? [
                  { key: 'outboundDate', header: '出货日期', type: 'date' },
                  { key: 'outboundNo', header: '货单号' },
                  { key: 'deliveryNo', header: '编号' },
                  { key: 'customer', header: '客户' },
                  { key: 'colorFabric.productSpec', header: '品名规格' },
                  { key: 'colorFabric.composition', header: '成分' },
                  { key: 'colorFabric.color', header: '颜色' },
                  { key: 'craft', header: '工艺' },
                  {
                    key: 'colorFabric.weight',
                    header: '克重(g/m²)',
                    type: 'number',
                  },
                  { key: 'customerNote', header: '客户备注' },
                  { key: 'quantity', header: '匹数', type: 'number' },
                  { key: 'weightKg', header: '重量(kg)', type: 'number' },
                  { key: 'unitPrice', header: '单价(元)', type: 'number' },
                  { key: 'amount', header: '金额(元)', type: 'number' },
                  { key: 'consignee', header: '签收人' },
                  { key: 'remark', header: '备注' },
                ]
              : type === 'stock'
                ? [
                    { key: 'colorFabric.productSpec', header: '品名规格' },
                    { key: 'colorFabric.composition', header: '成分' },
                    {
                      key: 'colorFabric.weight',
                      header: '克重(g/m²)',
                      type: 'number',
                    },
                    {
                      key: 'colorFabric.width',
                      header: '全幅宽(cm)',
                      type: 'number',
                    },
                    { key: 'colorFabric.color', header: '颜色' },
                    { key: 'colorFabric.colorNo', header: '色号' },
                    {
                      key: 'totalInboundQuantity',
                      header: '入库匹数',
                      type: 'number',
                    },
                    {
                      key: 'totalInboundWeight',
                      header: '入库重量(kg)',
                      type: 'number',
                    },
                    {
                      key: 'totalOutboundQuantity',
                      header: '出库匹数',
                      type: 'number',
                    },
                    {
                      key: 'totalOutboundWeight',
                      header: '出库重量(kg)',
                      type: 'number',
                    },
                    {
                      key: 'currentQuantity',
                      header: '库存匹数',
                      type: 'number',
                    },
                    {
                      key: 'currentWeight',
                      header: '库存重量(kg)',
                      type: 'number',
                    },
                  ]
                : (undefined as any);
    if (!columns) throw new BadRequestException('不支持的导出类型');
    const filters = pickFilters(type, query || {});
    let finalIds: string[] = [];
    if (allFlag) {
      finalIds = await this.svc.findIdsByFilter(type as any, filters);
      if (!finalIds.length) throw new BadRequestException('无匹配数据可导出');
    } else {
      if (!idList.length) throw new BadRequestException('ID数组不能为空');
      await this.svc.validateIdsAgainstFilter(type as any, idList, filters);
      finalIds = idList;
    }
    if (!asyncMode) {
      if (finalIds.length > 5000)
        throw new BadRequestException(
          '数据量过大，请使用异步导出（async=true）',
        );
      res.setHeader('Content-Type', 'application/vnd.ms-excel');
      const fn = this.svc.makeFilename(undefined, type);
      res.setHeader('Content-Disposition', `attachment; filename=\"${fn}\"`);
      await this.svc.streamExcel(
        { entity: type as any, ids: finalIds, columns },
        res,
      );
      return;
    }
    const task = await this.svc.enqueue({
      entity: type as any,
      ids: finalIds,
      columns,
      filename: undefined,
    });
    return res.json({ taskId: task.id });
  }
}
@ApiTags('report')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('report/export')
export class ReportExportController {
  constructor(private readonly svc: ExportService) {}

  @Get(':type')
  @ApiQuery({
    name: 'ids',
    required: false,
    type: [String],
    description: 'ID数组',
  })
  async exportByType(
    @Param('type') type: string,
    @Query('ids') ids: string[] | string,
    @Query('ids[]') idsBracket: string[] | string | undefined,
    @Res() res: Response,
    @Query('isAll') isAll?: string,
    @Query('async') asyncFlag?: string,
    @Query() query?: Record<string, any>,
  ) {
    const raw =
      Array.isArray(idsBracket) || typeof idsBracket === 'string'
        ? idsBracket
        : ids;
    const idList = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const asyncMode = String(asyncFlag || '').toLowerCase() === 'true';
    const allFlag = String(isAll || '').toUpperCase() === 'Y';
    const columns: ExportColumn[] =
      type === 'receivable'
        ? [
            { key: 'outboundDate', header: '出货日期', type: 'date' },
            { key: 'outboundNo', header: '货单号' },
            { key: 'deliveryNo', header: '编号' },
            { key: 'customer', header: '客户' },
            { key: 'productSpec', header: '品名规格' },
            { key: 'composition', header: '成分' },
            { key: 'color', header: '颜色' },
            { key: 'craft', header: '工艺' },
            { key: 'fabricWeight', header: '克重' },
            { key: 'customerRemark', header: '客户备注' },
            { key: 'pieceCount', header: '匹数', type: 'number' },
            { key: 'totalWeight', header: '重量', type: 'number' },
            { key: 'unitPrice', header: '单价', type: 'number' },
            { key: 'receivableAmount', header: '应收金额', type: 'number' },
            { key: 'receivedAmount', header: '已收金额', type: 'number' },
            { key: 'taxInvoiceAmount', header: '税票金额', type: 'number' },
            { key: 'unpaidAmount', header: '未收金额', type: 'number' },
            { key: 'remark', header: '备注' },
          ]
        : type === 'payable'
          ? [
              { key: 'inboundDate', header: '入库日期', type: 'date' },
              { key: 'inboundNo', header: '货单编号' },
              { key: 'supplier', header: '供应商' },
              { key: 'productSpec', header: '品名规格' },
              { key: 'composition', header: '成分' },
              { key: 'color', header: '颜色' },
              { key: 'fabricWeight', header: '克重' },
              {
                key: 'inboundOrder.colorFabric.width',
                header: '全幅宽',
                type: 'number',
              },
              { key: 'inboundOrder.colorFabric.colorNo', header: '色号' },
              { key: 'inboundOrder.colorFabric.batchNo', header: '缸号' },
              { key: 'pieceCount', header: '匹数', type: 'number' },
              { key: 'totalWeight', header: '重量', type: 'number' },
              { key: 'unitPrice', header: '单价', type: 'number' },
              { key: 'payableAmount', header: '应付金额', type: 'number' },
              { key: 'paidAmount', header: '已付金额', type: 'number' },
              { key: 'taxInvoiceAmount', header: '税票金额', type: 'number' },
              { key: 'unpaidAmount', header: '未付金额', type: 'number' },
              { key: 'remark', header: '备注' },
            ]
          : type === 'inbound'
            ? [
                { key: 'inboundDate', header: '入库日期', type: 'date' },
                { key: 'inboundNo', header: '货单编号' },
                { key: 'supplier', header: '供应商' },
                { key: 'colorFabric.productSpec', header: '品名规格' },
                { key: 'colorFabric.composition', header: '成分' },
                {
                  key: 'colorFabric.weight',
                  header: '克重(g/m²)',
                  type: 'number',
                },
                {
                  key: 'colorFabric.width',
                  header: '全幅宽(cm)',
                  type: 'number',
                },
                { key: 'colorFabric.color', header: '颜色' },
                { key: 'colorFabric.colorNo', header: '色号' },
                { key: 'colorFabric.batchNo', header: '缸号' },
                { key: 'quantity', header: '匹数', type: 'number' },
                { key: 'weightKg', header: '重量(kg)', type: 'number' },
                { key: 'unitPrice', header: '单价(元)', type: 'number' },
                { key: 'amount', header: '金额(元)', type: 'number' },
              ]
            : type === 'outbound'
              ? [
                  { key: 'outboundDate', header: '出货日期', type: 'date' },
                  { key: 'outboundNo', header: '货单号' },
                  { key: 'deliveryNo', header: '编号' },
                  { key: 'customer', header: '客户' },
                  { key: 'colorFabric.productSpec', header: '品名规格' },
                  { key: 'colorFabric.composition', header: '成分' },
                  { key: 'colorFabric.color', header: '颜色' },
                  { key: 'craft', header: '工艺' },
                  {
                    key: 'colorFabric.weight',
                    header: '克重(g/m²)',
                    type: 'number',
                  },
                  { key: 'customerNote', header: '客户备注' },
                  { key: 'quantity', header: '匹数', type: 'number' },
                  { key: 'weightKg', header: '重量(kg)', type: 'number' },
                  { key: 'unitPrice', header: '单价(元)', type: 'number' },
                  { key: 'amount', header: '金额(元)', type: 'number' },
                  { key: 'consignee', header: '签收人' },
                  { key: 'remark', header: '备注' },
                ]
              : type === 'stock'
                ? [
                    { key: 'colorFabric.productSpec', header: '品名规格' },
                    { key: 'colorFabric.composition', header: '成分' },
                    {
                      key: 'colorFabric.weight',
                      header: '克重(g/m²)',
                      type: 'number',
                    },
                    {
                      key: 'colorFabric.width',
                      header: '全幅宽(cm)',
                      type: 'number',
                    },
                    { key: 'colorFabric.color', header: '颜色' },
                    { key: 'colorFabric.colorNo', header: '色号' },
                    {
                      key: 'totalInboundQuantity',
                      header: '入库匹数',
                      type: 'number',
                    },
                    {
                      key: 'totalInboundWeight',
                      header: '入库重量(kg)',
                      type: 'number',
                    },
                    {
                      key: 'totalOutboundQuantity',
                      header: '出库匹数',
                      type: 'number',
                    },
                    {
                      key: 'totalOutboundWeight',
                      header: '出库重量(kg)',
                      type: 'number',
                    },
                    {
                      key: 'currentQuantity',
                      header: '库存匹数',
                      type: 'number',
                    },
                    {
                      key: 'currentWeight',
                      header: '库存重量(kg)',
                      type: 'number',
                    },
                  ]
                : (undefined as any);
    if (!columns) throw new BadRequestException('不支持的导出类型');
    const filters = pickFilters(type, query || {});
    let finalIds: string[] = [];
    if (allFlag) {
      finalIds = await this.svc.findIdsByFilter(type as any, filters);
      if (!finalIds.length) throw new BadRequestException('无匹配数据可导出');
    } else {
      if (!idList.length) throw new BadRequestException('ID数组不能为空');
      await this.svc.validateIdsAgainstFilter(type as any, idList, filters);
      finalIds = idList;
    }
    if (!asyncMode) {
      if (finalIds.length > 5000)
        throw new BadRequestException(
          '数据量过大，请使用异步导出（async=true）',
        );
      res.setHeader('Content-Type', 'application/vnd.ms-excel');
      const fn = this.svc.makeFilename(undefined, type);
      res.setHeader('Content-Disposition', `attachment; filename="${fn}"`);
      await this.svc.streamExcel(
        { entity: type as any, ids: finalIds, columns },
        res,
      );
      return;
    }
    const task = await this.svc.enqueue({
      entity: type as any,
      ids: finalIds,
      columns,
      filename: undefined,
    });
    return res.json({ taskId: task.id });
  }
}
