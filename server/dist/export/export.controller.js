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
exports.ReportExportController = exports.ReportControllerAlias = exports.ExportController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_guard_1 = require("../auth/jwt.guard");
const export_service_1 = require("./export.service");
const common_2 = require("@nestjs/common");
const fs = require("fs");
const pickFilters = (type, q) => {
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
let ExportController = class ExportController {
    constructor(svc) {
        this.svc = svc;
    }
    async exportExcel(body, asyncFlag, res) {
        const asyncMode = String(asyncFlag || '').toLowerCase() === 'true';
        if (!Array.isArray(body?.ids) || !body.ids.length)
            throw new common_1.BadRequestException('ID数组不能为空');
        if (!Array.isArray(body?.columns) || !body.columns.length)
            throw new common_1.BadRequestException('列定义不能为空');
        if (!body.entity)
            throw new common_1.BadRequestException('实体类型不能为空');
        if (asyncMode) {
            const task = await this.svc.enqueue(body);
            return res.json({ taskId: task.id });
        }
        res.setHeader('Content-Type', 'application/vnd.ms-excel');
        const fn = this.svc.makeFilename(body.filename, body.entity);
        res.setHeader('Content-Disposition', `attachment; filename="${fn}"`);
        await this.svc.streamExcel(body, res);
    }
    async taskStatus(id) {
        const t = this.svc.getTask(id);
        if (!t)
            throw new common_1.BadRequestException('任务不存在');
        return { state: t.state, progress: t.progress, error: t.error };
    }
    async taskDownload(id, res) {
        const t = this.svc.getTask(id);
        if (!t)
            throw new common_1.BadRequestException('任务不存在');
        if (t.state !== 'finished' || !t.filePath || !fs.existsSync(t.filePath)) {
            throw new common_1.BadRequestException('任务未完成或文件不可用');
        }
        res.setHeader('Content-Type', 'application/vnd.ms-excel');
        res.setHeader('Content-Disposition', `attachment; filename="${this.svc.makeFilename(undefined, t.payload.entity)}"`);
        fs.createReadStream(t.filePath).pipe(res);
    }
};
exports.ExportController = ExportController;
__decorate([
    (0, common_1.Post)('excel'),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, swagger_1.ApiQuery)({
        name: 'async',
        required: false,
        type: Boolean,
        description: '是否使用异步任务',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('async')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "exportExcel", null);
__decorate([
    (0, common_2.Get)('tasks/:id/status'),
    __param(0, (0, common_2.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "taskStatus", null);
__decorate([
    (0, common_2.Get)('tasks/:id/download'),
    __param(0, (0, common_2.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "taskDownload", null);
exports.ExportController = ExportController = __decorate([
    (0, swagger_1.ApiTags)('export'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('export'),
    __metadata("design:paramtypes", [export_service_1.ExportService])
], ExportController);
let ReportControllerAlias = class ReportControllerAlias {
    constructor(svc) {
        this.svc = svc;
    }
    async exportByTypeAlias(type, ids, idsBracket, res, isAll, asyncFlag, query) {
        const raw = Array.isArray(idsBracket) || typeof idsBracket === 'string'
            ? idsBracket
            : ids;
        const idList = Array.isArray(raw) ? raw : raw ? [raw] : [];
        const asyncMode = String(asyncFlag || '').toLowerCase() === 'true';
        const allFlag = String(isAll || '').toUpperCase() === 'Y';
        const columns = type === 'receivable'
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
                            : undefined;
        if (!columns)
            throw new common_1.BadRequestException('不支持的导出类型');
        const filters = pickFilters(type, query || {});
        let finalIds = [];
        if (allFlag) {
            finalIds = await this.svc.findIdsByFilter(type, filters);
            if (!finalIds.length)
                throw new common_1.BadRequestException('无匹配数据可导出');
        }
        else {
            if (!idList.length)
                throw new common_1.BadRequestException('ID数组不能为空');
            await this.svc.validateIdsAgainstFilter(type, idList, filters);
            finalIds = idList;
        }
        if (!asyncMode) {
            if (finalIds.length > 5000)
                throw new common_1.BadRequestException('数据量过大，请使用异步导出（async=true）');
            res.setHeader('Content-Type', 'application/vnd.ms-excel');
            const fn = this.svc.makeFilename(undefined, type);
            res.setHeader('Content-Disposition', `attachment; filename=\"${fn}\"`);
            await this.svc.streamExcel({ entity: type, ids: finalIds, columns }, res);
            return;
        }
        const task = await this.svc.enqueue({
            entity: type,
            ids: finalIds,
            columns,
            filename: undefined,
        });
        return res.json({ taskId: task.id });
    }
};
exports.ReportControllerAlias = ReportControllerAlias;
__decorate([
    (0, common_2.Get)('export/:type'),
    (0, swagger_1.ApiQuery)({
        name: 'ids',
        required: false,
        type: [String],
        description: 'ID数组',
    }),
    __param(0, (0, common_2.Param)('type')),
    __param(1, (0, common_1.Query)('ids')),
    __param(2, (0, common_1.Query)('ids[]')),
    __param(3, (0, common_1.Res)()),
    __param(4, (0, common_1.Query)('isAll')),
    __param(5, (0, common_1.Query)('async')),
    __param(6, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportControllerAlias.prototype, "exportByTypeAlias", null);
exports.ReportControllerAlias = ReportControllerAlias = __decorate([
    (0, swagger_1.ApiTags)('report'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('report'),
    __metadata("design:paramtypes", [export_service_1.ExportService])
], ReportControllerAlias);
let ReportExportController = class ReportExportController {
    constructor(svc) {
        this.svc = svc;
    }
    async exportByType(type, ids, idsBracket, res, isAll, asyncFlag, query) {
        const raw = Array.isArray(idsBracket) || typeof idsBracket === 'string'
            ? idsBracket
            : ids;
        const idList = Array.isArray(raw) ? raw : raw ? [raw] : [];
        const asyncMode = String(asyncFlag || '').toLowerCase() === 'true';
        const allFlag = String(isAll || '').toUpperCase() === 'Y';
        const columns = type === 'receivable'
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
                            : undefined;
        if (!columns)
            throw new common_1.BadRequestException('不支持的导出类型');
        const filters = pickFilters(type, query || {});
        let finalIds = [];
        if (allFlag) {
            finalIds = await this.svc.findIdsByFilter(type, filters);
            if (!finalIds.length)
                throw new common_1.BadRequestException('无匹配数据可导出');
        }
        else {
            if (!idList.length)
                throw new common_1.BadRequestException('ID数组不能为空');
            await this.svc.validateIdsAgainstFilter(type, idList, filters);
            finalIds = idList;
        }
        if (!asyncMode) {
            if (finalIds.length > 5000)
                throw new common_1.BadRequestException('数据量过大，请使用异步导出（async=true）');
            res.setHeader('Content-Type', 'application/vnd.ms-excel');
            const fn = this.svc.makeFilename(undefined, type);
            res.setHeader('Content-Disposition', `attachment; filename="${fn}"`);
            await this.svc.streamExcel({ entity: type, ids: finalIds, columns }, res);
            return;
        }
        const task = await this.svc.enqueue({
            entity: type,
            ids: finalIds,
            columns,
            filename: undefined,
        });
        return res.json({ taskId: task.id });
    }
};
exports.ReportExportController = ReportExportController;
__decorate([
    (0, common_2.Get)(':type'),
    (0, swagger_1.ApiQuery)({
        name: 'ids',
        required: false,
        type: [String],
        description: 'ID数组',
    }),
    __param(0, (0, common_2.Param)('type')),
    __param(1, (0, common_1.Query)('ids')),
    __param(2, (0, common_1.Query)('ids[]')),
    __param(3, (0, common_1.Res)()),
    __param(4, (0, common_1.Query)('isAll')),
    __param(5, (0, common_1.Query)('async')),
    __param(6, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportExportController.prototype, "exportByType", null);
exports.ReportExportController = ReportExportController = __decorate([
    (0, swagger_1.ApiTags)('report'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('report/export'),
    __metadata("design:paramtypes", [export_service_1.ExportService])
], ReportExportController);
//# sourceMappingURL=export.controller.js.map