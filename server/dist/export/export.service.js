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
var ExportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const inbound_entity_1 = require("../inventory/inbound/inbound.entity");
const outbound_entity_1 = require("../inventory/outbound/outbound.entity");
const inventory_entity_1 = require("../inventory/stock/inventory.entity");
const color_fabric_entity_1 = require("../inventory/fabric/color-fabric.entity");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto_1 = require("crypto");
const receivable_entity_1 = require("../finance/receivable/receivable.entity");
const payable_entity_1 = require("../finance/payable/payable.entity");
let ExportService = ExportService_1 = class ExportService {
    constructor(inRepo, outRepo, invRepo, cfRepo, rcRepo, pyRepo) {
        this.inRepo = inRepo;
        this.outRepo = outRepo;
        this.invRepo = invRepo;
        this.cfRepo = cfRepo;
        this.rcRepo = rcRepo;
        this.pyRepo = pyRepo;
        this.taskMap = new Map();
        this.logger = new common_1.Logger(ExportService_1.name);
    }
    makeFilename(provided, entity) {
        const stamp = this.formatDate(new Date(), 'YYYYMMDD_HHmmss');
        const base = provided?.trim() || `export_${entity}_${stamp}`;
        return base.endsWith('.xlsx') ? base : `${base}.xlsx`;
    }
    makeFilenameWithExt(provided, entity, format) {
        const stamp = this.formatDate(new Date(), 'YYYYMMDD_HHmmss');
        const base = provided?.trim() || `export_${entity}_${stamp}`;
        const ext = format === 'csv' ? '.csv' : '.xlsx';
        return base.endsWith(ext) ? base : `${base}${ext}`;
    }
    formatDate(d, fmt) {
        const pad = (n, w = 2) => String(n).padStart(w, '0');
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
    async streamExcel(payload, res) {
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
                const rowObj = {};
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
        if (written === 0)
            throw new common_1.BadRequestException('未找到匹配记录');
        this.applyFormats(ws, columns);
        this.autofitColumns(ws);
        await wb.xlsx.write(res);
        res.end();
    }
    async exportByEntityWithConfig(entity, ids, cfg, format, res, filename) {
        if (!entity)
            throw new common_1.BadRequestException('实体类型不能为空');
        if (!Array.isArray(ids) || !ids.length)
            throw new common_1.BadRequestException('ID数组不能为空');
        if (!Array.isArray(cfg?.fields) || !cfg.fields.length)
            throw new common_1.BadRequestException('字段配置不能为空');
        const rows = await this.fetchRows(entity, ids);
        const data = rows.map((r) => {
            const obj = {};
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
    async writeXlsxFromObjects(rows, cfg, res) {
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
        const maxLens = headers.map((h) => String(h).length);
        for (const r of rows) {
            const row = sheet.addRow(headers.map((h) => r[h]));
            for (let i = 0; i < headers.length; i++) {
                const cell = row.getCell(i + 1);
                cell.font = { size: FONT_SIZE, name: cfg?.style?.fontFamily };
                cell.alignment = { wrapText: true, vertical: 'middle' };
                const v = cell.value;
                const t = typeof v === 'string'
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
        sheet.columns?.forEach((col, idx) => {
            const base = cfg.fields[idx]?.width ??
                Math.min(60, Math.max(10, (maxLens[idx] || 10) + 2));
            col.width = Math.min(90, Math.round(base * 1.5));
        });
        await wb.xlsx.write(res);
        res.end();
    }
    writeCsvFromObjects(rows, res) {
        const headers = rows.length ? Object.keys(rows[0]) : [];
        const escape = (val) => {
            const s = val == null ? '' : String(val);
            if (/[",\r\n]/.test(s))
                return `"${s.replace(/"/g, '""')}"`;
            return s;
        };
        res.write(headers.map(escape).join(',') + '\r\n');
        for (const r of rows) {
            const line = headers.map((h) => escape(r[h])).join(',');
            res.write(line + '\r\n');
        }
        res.end();
    }
    async enqueue(payload) {
        this.validatePayload(payload);
        const id = (0, crypto_1.randomUUID)();
        const t = {
            id,
            payload,
            state: 'pending',
            progress: 0,
        };
        this.taskMap.set(id, t);
        setImmediate(() => this.runTask(id).catch(() => void 0));
        return t;
    }
    getTask(id) {
        return this.taskMap.get(id);
    }
    async runTask(id) {
        const task = this.taskMap.get(id);
        if (!task)
            return;
        task.state = 'running';
        task.progress = 0;
        try {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'export-'));
            const file = path.join(tmpDir, this.makeFilename(task.payload.filename, task.payload.entity));
            const wb = new ExcelJS.stream.xlsx.WorkbookWriter({
                filename: file,
                useStyles: true,
                useSharedStrings: true,
            });
            wb.created = new Date();
            wb.modified = new Date();
            const ws = wb.addWorksheet('Sheet1');
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
            const maxLens = columns.map((c) => String(c.header || '').length);
            for (let i = 0; i < ids.length; i += batchSize) {
                const chunk = ids.slice(i, i + batchSize);
                const rows = await this.fetchRows(entity, chunk);
                for (const r of rows) {
                    const rowObj = {};
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
                        const t = typeof val === 'string'
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
                throw new common_1.BadRequestException('未找到匹配记录');
            }
            this.applyFormats(ws, columns);
            ws.columns?.forEach((col, idx) => {
                const max = maxLens[idx] || 10;
                const base = Math.min(60, Math.max(10, max + 2));
                col.width = Math.min(90, Math.round(base * 1.5));
            });
            ws.commit();
            await wb.commit();
            task.state = 'finished';
            task.filePath = file;
            task.progress = 100;
        }
        catch (e) {
            task.state = 'failed';
            task.error = e?.message || '导出任务失败';
        }
    }
    validatePayload(p) {
        if (!p.entity)
            throw new common_1.BadRequestException('实体类型不能为空');
        if (!Array.isArray(p.ids) || !p.ids.length)
            throw new common_1.BadRequestException('ID数组不能为空');
        if (!Array.isArray(p.columns) || !p.columns.length)
            throw new common_1.BadRequestException('列定义不能为空');
        if (!p.ids.every((x) => typeof x === 'string' && x.length > 0))
            throw new common_1.BadRequestException('ID格式错误');
    }
    async fetchRows(entity, ids) {
        if (entity === 'inbound') {
            return this.inRepo.find({
                where: { id: (0, typeorm_2.In)(ids) },
                relations: ['colorFabric', 'batch'],
            });
        }
        if (entity === 'outbound') {
            return this.outRepo.find({
                where: { id: (0, typeorm_2.In)(ids) },
                relations: ['colorFabric'],
            });
        }
        if (entity === 'stock') {
            return this.invRepo.find({
                where: { id: (0, typeorm_2.In)(ids) },
                relations: ['colorFabric'],
            });
        }
        if (entity === 'colorFabric') {
            return this.cfRepo.find({
                where: { id: (0, typeorm_2.In)(ids) },
            });
        }
        if (entity === 'receivable') {
            const rows = await this.rcRepo.find({
                where: { id: (0, typeorm_2.In)(ids) },
                relations: ['outboundOrder', 'outboundOrder.colorFabric'],
            });
            return rows.map((r) => {
                const out = r.outboundOrder || {};
                const cf = out.colorFabric || {};
                const receivableAmount = Number(((r.receivableAmount
                    ? Number(r.receivableAmount)
                    : Number(out.amount || 0)) || 0).toFixed(2));
                const receivedAmount = Number(Number(r.receivedAmount || 0).toFixed(2));
                const unpaidAmount = Number((r.unpaidAmount !== undefined && r.unpaidAmount !== null
                    ? Number(r.unpaidAmount)
                    : receivableAmount - receivedAmount).toFixed(2));
                return {
                    ...r,
                    outboundDate: String(out.outboundDate || r.outboundDate || '').substring(0, 10) ||
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
                    totalWeight: Number(r.totalWeight !== null ? r.totalWeight : out.weightKg || 0),
                    unitPrice: Number(r.unitPrice !== null ? r.unitPrice : out.unitPrice || 0),
                    receivableAmount,
                    receivedAmount,
                    unpaidAmount,
                    taxInvoiceAmount: Number(Number(r.taxInvoiceAmount || 0).toFixed(2)),
                };
            });
        }
        if (entity === 'payable') {
            const rows = await this.pyRepo.find({
                where: { id: (0, typeorm_2.In)(ids) },
                relations: ['inboundOrder', 'inboundOrder.colorFabric'],
            });
            return rows.map((p) => {
                const ino = p.inboundOrder || {};
                const cf = ino.colorFabric || {};
                const payableAmount = Number(((p.payableAmount
                    ? Number(p.payableAmount)
                    : Number(ino.amount || 0)) || 0).toFixed(2));
                const paidAmount = Number(Number(p.paidAmount || 0).toFixed(2));
                const unpaidAmount = Number((p.unpaidAmount !== undefined && p.unpaidAmount !== null
                    ? Number(p.unpaidAmount)
                    : payableAmount - paidAmount).toFixed(2));
                return {
                    ...p,
                    inboundDate: String(ino.inboundDate || p.inboundDate || '').substring(0, 10) ||
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
                    totalWeight: Number(p.totalWeight !== null ? p.totalWeight : ino.weightKg || 0),
                    unitPrice: Number(p.unitPrice !== null ? p.unitPrice : ino.unitPrice || 0),
                    payableAmount,
                    paidAmount,
                    unpaidAmount,
                    taxInvoiceAmount: Number(Number(p.taxInvoiceAmount || 0).toFixed(2)),
                    inboundOrder: {
                        ...ino,
                        colorFabric: cf,
                    },
                };
            });
        }
        throw new common_1.BadRequestException('不支持的实体类型');
    }
    pickValue(row, key) {
        const parts = key.split('.');
        let cur = row;
        for (const p of parts) {
            if (cur == null)
                return null;
            if (!(p in cur))
                return null;
            cur = cur[p];
        }
        return cur;
    }
    normalizeValue(v, type) {
        if (v == null)
            return '';
        if (type === 'number')
            return Number(v);
        if (type === 'date') {
            const d = v instanceof Date ? v : new Date(String(v));
            return isNaN(d.getTime()) ? String(v) : d;
        }
        return String(v);
    }
    applyFormats(ws, columns) {
        columns.forEach((c, idx) => {
            const col = ws.getColumn(idx + 1);
            if (c.type === 'number') {
                col.numFmt = '#,##0.00';
            }
            else if (c.type === 'date') {
                col.numFmt = 'yyyy-mm-dd';
            }
        });
    }
    autofitColumns(ws) {
        ws.columns?.forEach((col) => {
            if (!col)
                return;
            let max = String(col.header || '').length;
            col.eachCell?.({ includeEmpty: true }, (cell) => {
                const v = cell.value;
                const t = typeof v === 'string'
                    ? v
                    : typeof v === 'number'
                        ? String(v)
                        : v instanceof Date
                            ? 'YYYY-MM-DD'
                            : '';
                max = Math.max(max, t.length);
            });
            const base = Math.min(60, Math.max(10, max + 2));
            col.width = Math.min(90, Math.round(base * 1.5));
        });
    }
    async findIdsByFilter(entity, filters) {
        if (entity === 'receivable') {
            const qb = this.rcRepo
                .createQueryBuilder('r')
                .leftJoin('r.outboundOrder', 'out')
                .where('1=1');
            const customer = filters.customer;
            const startDate = filters.startDate;
            const endDate = filters.endDate;
            if (customer)
                qb.andWhere('r.customer LIKE :c', { c: `%${customer}%` });
            if (startDate)
                qb.andWhere('out.outboundDate >= :sd', { sd: startDate });
            if (endDate)
                qb.andWhere('out.outboundDate <= :ed', { ed: endDate });
            const rows = await qb.select(['r.id']).getMany();
            return rows.map((x) => x.id);
        }
        if (entity === 'payable') {
            const qb = this.pyRepo
                .createQueryBuilder('p')
                .leftJoin('p.inboundOrder', 'in')
                .where('p.deletedAt IS NULL');
            const customer = filters.customer;
            const startDate = filters.startDate;
            const endDate = filters.endDate;
            if (customer)
                qb.andWhere('p.supplier LIKE :c', { c: `%${customer}%` });
            if (startDate)
                qb.andWhere('in.inboundDate >= :sd', { sd: startDate });
            if (endDate)
                qb.andWhere('in.inboundDate <= :ed', { ed: endDate });
            const rows = await qb.select(['p.id']).getMany();
            return rows.map((x) => x.id);
        }
        if (entity === 'inbound') {
            const qb = this.inRepo
                .createQueryBuilder('in')
                .leftJoin('in.colorFabric', 'cf');
            const inboundNo = filters.inboundNo;
            const supplier = filters.supplier;
            const productSpec = filters.productSpec;
            const dateStart = filters.dateStart;
            const dateEnd = filters.dateEnd;
            if (inboundNo)
                qb.andWhere('in.inboundNo LIKE :no', { no: `%${inboundNo}%` });
            if (supplier)
                qb.andWhere('in.supplier LIKE :sp', { sp: `%${supplier}%` });
            if (productSpec)
                qb.andWhere('cf.productSpec LIKE :ps', { ps: `%${productSpec}%` });
            if (dateStart)
                qb.andWhere('in.inboundDate >= :ds', { ds: dateStart });
            if (dateEnd)
                qb.andWhere('in.inboundDate <= :de', { de: dateEnd });
            const rows = await qb.select(['in.id']).getMany();
            return rows.map((x) => x.id);
        }
        if (entity === 'outbound') {
            const qb = this.outRepo
                .createQueryBuilder('out')
                .leftJoin('out.colorFabric', 'cf');
            const outboundNo = filters.outboundNo;
            const customer = filters.customer;
            const productSpec = filters.productSpec;
            const dateStart = filters.dateStart;
            const dateEnd = filters.dateEnd;
            if (outboundNo)
                qb.andWhere('out.outboundNo LIKE :no', { no: `%${outboundNo}%` });
            if (customer)
                qb.andWhere('out.customer LIKE :c', { c: `%${customer}%` });
            if (productSpec)
                qb.andWhere('cf.productSpec LIKE :ps', { ps: `%${productSpec}%` });
            if (dateStart)
                qb.andWhere('out.outboundDate >= :ds', { ds: dateStart });
            if (dateEnd)
                qb.andWhere('out.outboundDate <= :de', { de: dateEnd });
            const rows = await qb.select(['out.id']).getMany();
            return rows.map((x) => x.id);
        }
        if (entity === 'stock') {
            const qb = this.invRepo
                .createQueryBuilder('inv')
                .leftJoin('inv.colorFabric', 'cf');
            const productSpec = filters.productSpec;
            const composition = filters.composition;
            const weight = filters.weight;
            const width = filters.width;
            const color = filters.color;
            const colorNo = filters.colorNo;
            if (productSpec)
                qb.andWhere('cf.productSpec LIKE :ps', { ps: `%${productSpec}%` });
            if (composition)
                qb.andWhere('cf.composition LIKE :cp', { cp: `%${composition}%` });
            if (weight !== undefined && weight !== null && weight !== '')
                qb.andWhere('cf.weight = :w', { w: weight });
            if (width !== undefined && width !== null && width !== '')
                qb.andWhere('cf.width = :wd', { wd: width });
            if (color)
                qb.andWhere('cf.color LIKE :cl', { cl: `%${color}%` });
            if (colorNo)
                qb.andWhere('cf.colorNo LIKE :cn', { cn: `%${colorNo}%` });
            const rows = await qb.select(['inv.id']).getMany();
            return rows.map((x) => x.id);
        }
        throw new common_1.BadRequestException('不支持的实体类型');
    }
    async validateIdsAgainstFilter(entity, ids, filters) {
        const matched = await this.findIdsByFilter(entity, filters);
        const set = new Set(matched);
        const allOk = ids.every((id) => set.has(id));
        if (!allOk) {
            throw new common_1.BadRequestException('存在不符合筛选条件的ID');
        }
    }
};
exports.ExportService = ExportService;
exports.ExportService = ExportService = ExportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(inbound_entity_1.InboundOrder)),
    __param(1, (0, typeorm_1.InjectRepository)(outbound_entity_1.OutboundOrder)),
    __param(2, (0, typeorm_1.InjectRepository)(inventory_entity_1.Inventory)),
    __param(3, (0, typeorm_1.InjectRepository)(color_fabric_entity_1.ColorFabric)),
    __param(4, (0, typeorm_1.InjectRepository)(receivable_entity_1.Receivable)),
    __param(5, (0, typeorm_1.InjectRepository)(payable_entity_1.Payable)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ExportService);
//# sourceMappingURL=export.service.js.map