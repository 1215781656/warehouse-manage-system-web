import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { InboundOrder } from '../inventory/inbound/inbound.entity';
import { OutboundOrder } from '../inventory/outbound/outbound.entity';
import { Inventory } from '../inventory/stock/inventory.entity';
import { ColorFabric } from '../inventory/fabric/color-fabric.entity';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { randomUUID } from 'crypto';
import { Receivable } from '../finance/receivable/receivable.entity';
import { Payable } from '../finance/payable/payable.entity';

export type ExportColumn = {
  key: string;
  header: string;
  type?: 'text' | 'number' | 'date';
};

export type ExportFormat = 'xlsx' | 'csv';

export type ExportField = {
  key: string;
  title: string;
  width?: number;
  formatter?: (value: any) => string;
};

export interface ExportConfig {
  fields: ExportField[];
  sheetName?: string;
  style?: {
    headerBgColor?: string;
    fontFamily?: string;
  };
}

type ExportPayload = {
  entity:
    | 'inbound'
    | 'outbound'
    | 'stock'
    | 'colorFabric'
    | 'receivable'
    | 'payable';
  ids: string[];
  columns: ExportColumn[];
  filename?: string;
};

type ExportTask = {
  id: string;
  payload: ExportPayload;
  state: 'pending' | 'running' | 'finished' | 'failed';
  progress: number;
  filePath?: string;
  error?: string;
};

@Injectable()
export class ExportService {
  private readonly taskMap = new Map<string, ExportTask>();
  private readonly logger = new Logger(ExportService.name);

  constructor(
    @InjectRepository(InboundOrder)
    private readonly inRepo: Repository<InboundOrder>,
    @InjectRepository(OutboundOrder)
    private readonly outRepo: Repository<OutboundOrder>,
    @InjectRepository(Inventory)
    private readonly invRepo: Repository<Inventory>,
    @InjectRepository(ColorFabric)
    private readonly cfRepo: Repository<ColorFabric>,
    @InjectRepository(Receivable)
    private readonly rcRepo: Repository<Receivable>,
    @InjectRepository(Payable)
    private readonly pyRepo: Repository<Payable>,
  ) {}

  makeFilename(provided: string | undefined, entity: string) {
    const stamp = this.formatDate(new Date(), 'YYYYMMDD_HHmmss');
    const base = provided?.trim() || `export_${entity}_${stamp}`;
    return base.endsWith('.xlsx') ? base : `${base}.xlsx`;
  }
  makeFilenameWithExt(
    provided: string | undefined,
    entity: string,
    format: ExportFormat,
  ) {
    const stamp = this.formatDate(new Date(), 'YYYYMMDD_HHmmss');
    const base = provided?.trim() || `export_${entity}_${stamp}`;
    const ext = format === 'csv' ? '.csv' : '.xlsx';
    return base.endsWith(ext) ? base : `${base}${ext}`;
  }
  private formatDate(d: Date, fmt: string) {
    const pad = (n: number, w = 2) => String(n).padStart(w, '0');
    const YYYY = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const DD = pad(d.getDate());
    const HH = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return fmt
      .replace('YYYY', String(YYYY))
      .replace('MM', MM)
      .replace('DD', DD)
      .replace('HH', HH)
      .replace('mm', mm)
      .replace('ss', ss);
  }

  async streamExcel(payload: ExportPayload, res: Response) {
    const { entity, ids, columns } = payload;
    this.validatePayload(payload);
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Warehouse System';
    wb.created = new Date();
    wb.modified = new Date();
    const ws = wb.addWorksheet('Sheet1');
    ws.columns = columns.map((c) => ({
      key: c.key,
      header: c.header,
    }));
    const FONT_SIZE = 16;
    const ROW_HEIGHT = 22;
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, size: FONT_SIZE };
    headerRow.alignment = { wrapText: true, vertical: 'middle' };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEFEFEF' },
    };
    headerRow.height = ROW_HEIGHT;
    const batchSize = 500;
    const total = ids.length;
    let written = 0;
    for (let i = 0; i < ids.length; i += batchSize) {
      const chunk = ids.slice(i, i + batchSize);
      const rows = await this.fetchRows(entity, chunk);
      for (const r of rows) {
        const rowObj: Record<string, any> = {};
        for (const col of columns) {
          const v = this.pickValue(r, col.key);
          rowObj[col.key] = this.normalizeValue(v, col.type);
        }
        const row = ws.addRow(rowObj);
        for (let ci = 0; ci < columns.length; ci++) {
          const cell = row.getCell(ci + 1);
          cell.font = { size: FONT_SIZE };
          cell.alignment = { wrapText: true, vertical: 'middle' };
        }
        row.height = ROW_HEIGHT;
        written++;
      }
    }
    if (written === 0) throw new BadRequestException('未找到匹配记录');
    this.applyFormats(ws, columns);
    this.autofitColumns(ws);
    await wb.xlsx.write(res);
    res.end();
  }

  /**
   * 使用通用配置导出数据
   */
  async exportByEntityWithConfig(
    entity: ExportPayload['entity'],
    ids: string[],
    cfg: ExportConfig,
    format: ExportFormat,
    res: Response,
    filename?: string,
  ) {
    if (!entity) throw new BadRequestException('实体类型不能为空');
    if (!Array.isArray(ids) || !ids.length)
      throw new BadRequestException('ID数组不能为空');
    if (!Array.isArray(cfg?.fields) || !cfg.fields.length)
      throw new BadRequestException('字段配置不能为空');
    const rows = await this.fetchRows(entity, ids);
    const data = rows.map((r) => {
      const obj: Record<string, any> = {};
      for (const f of cfg.fields) {
        const raw = this.pickValue(r, f.key);
        obj[f.title] =
          typeof f.formatter === 'function' ? f.formatter(raw) : raw;
      }
      return obj;
    });
    const name = this.makeFilenameWithExt(filename, entity, format);
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
      this.writeCsvFromObjects(data, res);
      return;
    }
    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    await this.writeXlsxFromObjects(data, cfg, res);
  }

  /**
   * 通过对象数组写入XLSX
   */
  async writeXlsxFromObjects(
    rows: Array<Record<string, any>>,
    cfg: ExportConfig,
    res: Response,
  ) {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet(cfg.sheetName || 'Sheet1');
    const headers = cfg.fields.map((f) => f.title);
    sheet.columns = headers.map((h, idx) => ({
      header: h,
      key: `c_${idx}`,
      width: cfg.fields[idx]?.width,
    }));
    const FONT_SIZE = 16;
    const ROW_HEIGHT = 22;
    const headerRow = sheet.getRow(1);
    headerRow.font = {
      bold: true,
      size: FONT_SIZE,
      name: cfg?.style?.fontFamily,
    };
    headerRow.alignment = { wrapText: true, vertical: 'middle' };
    headerRow.fill = cfg?.style?.headerBgColor
      ? {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: cfg.style.headerBgColor },
        }
      : { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } };
    headerRow.height = ROW_HEIGHT;
    const maxLens: number[] = headers.map((h) => String(h).length);
    for (const r of rows) {
      const row = sheet.addRow(headers.map((h) => r[h]));
      for (let i = 0; i < headers.length; i++) {
        const cell = row.getCell(i + 1);
        cell.font = { size: FONT_SIZE, name: cfg?.style?.fontFamily };
        cell.alignment = { wrapText: true, vertical: 'middle' };
        const v = cell.value;
        const t =
          typeof v === 'string'
            ? v
            : typeof v === 'number'
              ? String(v)
              : v instanceof Date
                ? 'YYYY-MM-DD'
                : '';
        maxLens[i] = Math.max(maxLens[i], t.length);
      }
      row.height = ROW_HEIGHT;
    }
    sheet.columns?.forEach((col: any, idx: number) => {
      const base =
        cfg.fields[idx]?.width ??
        Math.min(60, Math.max(10, (maxLens[idx] || 10) + 2));
      col.width = Math.min(90, Math.round(base * 1.5));
    });
    await wb.xlsx.write(res);
    res.end();
  }

  /**
   * 通过对象数组写入CSV
   */
  writeCsvFromObjects(rows: Array<Record<string, any>>, res: Response) {
    const headers = rows.length ? Object.keys(rows[0]) : [];
    const escape = (val: any) => {
      const s = val == null ? '' : String(val);
      if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    res.write(headers.map(escape).join(',') + '\r\n');
    for (const r of rows) {
      const line = headers.map((h) => escape(r[h])).join(',');
      res.write(line + '\r\n');
    }
    res.end();
  }

  async enqueue(payload: ExportPayload) {
    this.validatePayload(payload);
    const id = randomUUID();
    const t: ExportTask = {
      id,
      payload,
      state: 'pending',
      progress: 0,
    };
    this.taskMap.set(id, t);
    setImmediate(() => this.runTask(id).catch(() => void 0));
    return t;
  }

  getTask(id: string) {
    return this.taskMap.get(id);
  }

  async runTask(id: string) {
    const task = this.taskMap.get(id);
    if (!task) return;
    task.state = 'running';
    task.progress = 0;
    try {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'export-'));
      const file = path.join(
        tmpDir,
        this.makeFilename(task.payload.filename, task.payload.entity),
      );
      const wb = new (ExcelJS as any).stream.xlsx.WorkbookWriter({
        filename: file,
        useStyles: true,
        useSharedStrings: true,
      });
      wb.created = new Date();
      wb.modified = new Date();
      const ws = wb.addWorksheet('Sheet1') as any;
      ws.columns = task.payload.columns.map((c) => ({
        key: c.key,
        header: c.header,
      }));
      const { entity, ids, columns } = task.payload;
      const batchSize = 1000;
      const total = ids.length;
      let processed = 0;
      const FONT_SIZE = 16;
      const ROW_HEIGHT = 22;
      const headerRow = ws.getRow(1);
      if (headerRow) {
        headerRow.font = { bold: true, size: FONT_SIZE };
        headerRow.alignment = { wrapText: true, vertical: 'middle' };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFEFEFEF' },
        };
        headerRow.height = ROW_HEIGHT;
        headerRow.commit?.();
      }
      const maxLens: number[] = columns.map(
        (c) => String(c.header || '').length,
      );
      for (let i = 0; i < ids.length; i += batchSize) {
        const chunk = ids.slice(i, i + batchSize);
        const rows = await this.fetchRows(entity, chunk);
        for (const r of rows) {
          const rowObj: Record<string, any> = {};
          for (const col of columns) {
            const v = this.pickValue(r, col.key);
            rowObj[col.key] = this.normalizeValue(v, col.type);
          }
          const row = ws.addRow(rowObj);
          for (let ci = 0; ci < columns.length; ci++) {
            const cell = row.getCell(ci + 1);
            cell.font = { size: FONT_SIZE };
            cell.alignment = { wrapText: true, vertical: 'middle' };
            const val = cell.value;
            const t =
              typeof val === 'string'
                ? val
                : typeof val === 'number'
                  ? String(val)
                  : val instanceof Date
                    ? 'YYYY-MM-DD'
                    : '';
            maxLens[ci] = Math.max(maxLens[ci], t.length);
          }
          row.height = ROW_HEIGHT;
          row.commit();
          processed++;
          task.progress = Math.min(100, Math.round((processed / total) * 100));
        }
      }
      if (processed === 0) {
        throw new BadRequestException('未找到匹配记录');
      }
      // Set number/date formats
      this.applyFormats(ws as any, columns);
      // Auto-fit columns based on measured lengths
      ws.columns?.forEach((col: any, idx: number) => {
        const max = maxLens[idx] || 10;
        const base = Math.min(60, Math.max(10, max + 2));
        col.width = Math.min(90, Math.round(base * 1.5));
      });
      // commit worksheet and workbook
      (ws as any).commit();
      await wb.commit();
      task.state = 'finished';
      task.filePath = file;
      task.progress = 100;
    } catch (e: any) {
      task.state = 'failed';
      task.error = e?.message || '导出任务失败';
    }
  }

  validatePayload(p: ExportPayload) {
    if (!p.entity) throw new BadRequestException('实体类型不能为空');
    if (!Array.isArray(p.ids) || !p.ids.length)
      throw new BadRequestException('ID数组不能为空');
    if (!Array.isArray(p.columns) || !p.columns.length)
      throw new BadRequestException('列定义不能为空');
    if (!p.ids.every((x) => typeof x === 'string' && x.length > 0))
      throw new BadRequestException('ID格式错误');
  }

  async fetchRows(
    entity: ExportPayload['entity'],
    ids: string[],
  ): Promise<any[]> {
    if (entity === 'inbound') {
      return this.inRepo.find({
        where: { id: In(ids as any) } as any,
        relations: ['colorFabric', 'batch'],
      });
    }
    if (entity === 'outbound') {
      return this.outRepo.find({
        where: { id: In(ids as any) } as any,
        relations: ['colorFabric'],
      });
    }
    if (entity === 'stock') {
      return this.invRepo.find({
        where: { id: In(ids as any) } as any,
        relations: ['colorFabric'],
      });
    }
    if (entity === 'colorFabric') {
      return this.cfRepo.find({
        where: { id: In(ids as any) } as any,
      });
    }
    if (entity === 'receivable') {
      const rows = await this.rcRepo.find({
        where: { id: In(ids as any) } as any,
        relations: ['outboundOrder', 'outboundOrder.colorFabric'],
      });
      return rows.map((r: any) => {
        const out = r.outboundOrder || {};
        const cf = out.colorFabric || {};
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
        return {
          ...r,
          outboundDate:
            String(out.outboundDate || r.outboundDate || '').substring(0, 10) ||
            '',
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
          totalWeight: Number(
            r.totalWeight !== null ? r.totalWeight : out.weightKg || 0,
          ),
          unitPrice: Number(
            r.unitPrice !== null ? r.unitPrice : out.unitPrice || 0,
          ),
          receivableAmount,
          receivedAmount,
          unpaidAmount,
          taxInvoiceAmount: Number(Number(r.taxInvoiceAmount || 0).toFixed(2)),
        };
      });
    }
    if (entity === 'payable') {
      const rows = await this.pyRepo.find({
        where: { id: In(ids as any) } as any,
        relations: ['inboundOrder', 'inboundOrder.colorFabric'],
      });
      return rows.map((p: any) => {
        const ino = p.inboundOrder || {};
        const cf = ino.colorFabric || {};
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
        return {
          ...p,
          inboundDate:
            String(ino.inboundDate || p.inboundDate || '').substring(0, 10) ||
            '',
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
          totalWeight: Number(
            p.totalWeight !== null ? p.totalWeight : ino.weightKg || 0,
          ),
          unitPrice: Number(
            p.unitPrice !== null ? p.unitPrice : ino.unitPrice || 0,
          ),
          payableAmount,
          paidAmount,
          unpaidAmount,
          taxInvoiceAmount: Number(Number(p.taxInvoiceAmount || 0).toFixed(2)),
          inboundOrder: {
            ...ino,
            colorFabric: cf, // Ensure nested access still works for some fields
          },
        };
      });
    }
    throw new BadRequestException('不支持的实体类型');
  }

  pickValue(row: any, key: string) {
    // 支持嵌套取值，如 "colorFabric.colorFabricNo"
    const parts = key.split('.');
    let cur: any = row;
    for (const p of parts) {
      if (cur == null) return null;
      if (!(p in cur)) return null;
      cur = cur[p];
    }
    return cur;
  }

  normalizeValue(v: any, type?: ExportColumn['type']) {
    if (v == null) return '';
    if (type === 'number') return Number(v);
    if (type === 'date') {
      const d = v instanceof Date ? v : new Date(String(v));
      return isNaN(d.getTime()) ? String(v) : d;
    }
    return String(v);
  }

  applyFormats(ws: ExcelJS.Worksheet, columns: ExportColumn[]) {
    columns.forEach((c, idx) => {
      const col = ws.getColumn(idx + 1);
      if (c.type === 'number') {
        col.numFmt = '#,##0.00';
      } else if (c.type === 'date') {
        col.numFmt = 'yyyy-mm-dd';
      }
    });
  }

  autofitColumns(ws: ExcelJS.Worksheet) {
    ws.columns?.forEach((col) => {
      if (!col) return;
      let max = String((col as any).header || '').length;
      (col as any).eachCell?.({ includeEmpty: true }, (cell: any) => {
        const v = cell.value;
        const t =
          typeof v === 'string'
            ? v
            : typeof v === 'number'
              ? String(v)
              : v instanceof Date
                ? 'YYYY-MM-DD'
                : '';
        max = Math.max(max, t.length);
      });
      const base = Math.min(60, Math.max(10, max + 2));
      (col as any).width = Math.min(90, Math.round(base * 1.5));
    });
  }

  /**
   * 根据筛选条件查询匹配ID列表
   */
  async findIdsByFilter(
    entity: ExportPayload['entity'],
    filters: Record<string, any>,
  ): Promise<string[]> {
    if (entity === 'receivable') {
      const qb = this.rcRepo
        .createQueryBuilder('r')
        .leftJoin('r.outboundOrder', 'out')
        .where('1=1');
      const customer = (filters as any).customer;
      const startDate = (filters as any).startDate;
      const endDate = (filters as any).endDate;
      if (customer) qb.andWhere('r.customer LIKE :c', { c: `%${customer}%` });
      if (startDate) qb.andWhere('out.outboundDate >= :sd', { sd: startDate });
      if (endDate) qb.andWhere('out.outboundDate <= :ed', { ed: endDate });
      const rows = await qb.select(['r.id']).getMany();
      return rows.map((x: any) => x.id);
    }
    if (entity === 'payable') {
      const qb = this.pyRepo
        .createQueryBuilder('p')
        .leftJoin('p.inboundOrder', 'in')
        .where('p.deletedAt IS NULL');
      const customer = (filters as any).customer;
      const startDate = (filters as any).startDate;
      const endDate = (filters as any).endDate;
      if (customer) qb.andWhere('p.supplier LIKE :c', { c: `%${customer}%` });
      if (startDate) qb.andWhere('in.inboundDate >= :sd', { sd: startDate });
      if (endDate) qb.andWhere('in.inboundDate <= :ed', { ed: endDate });
      const rows = await qb.select(['p.id']).getMany();
      return rows.map((x: any) => x.id);
    }
    if (entity === 'inbound') {
      const qb = this.inRepo
        .createQueryBuilder('in')
        .leftJoin('in.colorFabric', 'cf');
      const inboundNo = (filters as any).inboundNo;
      const supplier = (filters as any).supplier;
      const productSpec = (filters as any).productSpec;
      const dateStart = (filters as any).dateStart;
      const dateEnd = (filters as any).dateEnd;
      if (inboundNo)
        qb.andWhere('in.inboundNo LIKE :no', { no: `%${inboundNo}%` });
      if (supplier)
        qb.andWhere('in.supplier LIKE :sp', { sp: `%${supplier}%` });
      if (productSpec)
        qb.andWhere('cf.productSpec LIKE :ps', { ps: `%${productSpec}%` });
      if (dateStart) qb.andWhere('in.inboundDate >= :ds', { ds: dateStart });
      if (dateEnd) qb.andWhere('in.inboundDate <= :de', { de: dateEnd });
      const rows = await qb.select(['in.id']).getMany();
      return rows.map((x: any) => x.id);
    }
    if (entity === 'outbound') {
      const qb = this.outRepo
        .createQueryBuilder('out')
        .leftJoin('out.colorFabric', 'cf');
      const outboundNo = (filters as any).outboundNo;
      const customer = (filters as any).customer;
      const productSpec = (filters as any).productSpec;
      const dateStart = (filters as any).dateStart;
      const dateEnd = (filters as any).dateEnd;
      if (outboundNo)
        qb.andWhere('out.outboundNo LIKE :no', { no: `%${outboundNo}%` });
      if (customer) qb.andWhere('out.customer LIKE :c', { c: `%${customer}%` });
      if (productSpec)
        qb.andWhere('cf.productSpec LIKE :ps', { ps: `%${productSpec}%` });
      if (dateStart) qb.andWhere('out.outboundDate >= :ds', { ds: dateStart });
      if (dateEnd) qb.andWhere('out.outboundDate <= :de', { de: dateEnd });
      const rows = await qb.select(['out.id']).getMany();
      return rows.map((x: any) => x.id);
    }
    if (entity === 'stock') {
      const qb = this.invRepo
        .createQueryBuilder('inv')
        .leftJoin('inv.colorFabric', 'cf');
      const productSpec = (filters as any).productSpec;
      const composition = (filters as any).composition;
      const weight = (filters as any).weight;
      const width = (filters as any).width;
      const color = (filters as any).color;
      const colorNo = (filters as any).colorNo;
      if (productSpec)
        qb.andWhere('cf.productSpec LIKE :ps', { ps: `%${productSpec}%` });
      if (composition)
        qb.andWhere('cf.composition LIKE :cp', { cp: `%${composition}%` });
      if (weight !== undefined && weight !== null && weight !== '')
        qb.andWhere('cf.weight = :w', { w: weight });
      if (width !== undefined && width !== null && width !== '')
        qb.andWhere('cf.width = :wd', { wd: width });
      if (color) qb.andWhere('cf.color LIKE :cl', { cl: `%${color}%` });
      if (colorNo) qb.andWhere('cf.colorNo LIKE :cn', { cn: `%${colorNo}%` });
      const rows = await qb.select(['inv.id']).getMany();
      return rows.map((x: any) => x.id);
    }
    throw new BadRequestException('不支持的实体类型');
  }

  /**
   * 验证ID是否符合筛选条件
   */
  async validateIdsAgainstFilter(
    entity: ExportPayload['entity'],
    ids: string[],
    filters: Record<string, any>,
  ) {
    const matched = await this.findIdsByFilter(entity, filters);
    const set = new Set(matched);
    const allOk = ids.every((id) => set.has(id));
    if (!allOk) {
      throw new BadRequestException('存在不符合筛选条件的ID');
    }
  }
}
