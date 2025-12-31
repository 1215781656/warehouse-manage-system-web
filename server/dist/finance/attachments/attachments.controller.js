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
exports.AttachmentsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const jwt_guard_1 = require("../../auth/jwt.guard");
const attachments_service_1 = require("./attachments.service");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const operation_log_entity_1 = require("../../system/operation-log.entity");
let AttachmentsController = class AttachmentsController {
    constructor(svc, logRepo) {
        this.svc = svc;
        this.logRepo = logRepo;
    }
    async uploadTaxForReceivable(id, files) {
        if (!files || !files.length)
            throw new common_1.BadRequestException('未选择文件');
        const oversized = files.find((f) => f.size > 10 * 1024 * 1024);
        if (oversized)
            throw new common_1.BadRequestException('单文件大小不能超过10MB');
        const list = await this.svc.saveTaxFiles(id, files.map((f) => ({
            buffer: f.buffer,
            mimetype: f.mimetype,
            originalname: f.originalname,
        })));
        await this.logRepo.save(this.logRepo.create({
            module: 'file',
            action: 'upload',
            refId: id,
            operator: 'system',
            detail: JSON.stringify({ type: 'tax', count: files.length }),
        }));
        const base = process.env.FILE_BASE || '';
        return list.map((x) => ({
            ...x,
            path: base ? `${base}${x.path}` : x.path,
        }));
    }
    async uploadTaxForInbound(id, files) {
        if (!files || !files.length)
            throw new common_1.BadRequestException('未选择文件');
        const oversized = files.find((f) => f.size > 10 * 1024 * 1024);
        if (oversized)
            throw new common_1.BadRequestException('单文件大小不能超过10MB');
        const list = await this.svc.saveTaxFiles(id, files.map((f) => ({
            buffer: f.buffer,
            mimetype: f.mimetype,
            originalname: f.originalname,
        })));
        await this.logRepo.save(this.logRepo.create({
            module: 'file',
            action: 'upload',
            refId: id,
            operator: 'system',
            detail: JSON.stringify({ type: 'tax', count: files.length, category: 'inbound' }),
        }));
        const base = process.env.FILE_BASE || '';
        return list.map((x) => ({
            ...x,
            path: base ? `${base}${x.path}` : x.path,
        }));
    }
    async uploadTaxForOutbound(id, files) {
        if (!files || !files.length)
            throw new common_1.BadRequestException('未选择文件');
        const oversized = files.find((f) => f.size > 10 * 1024 * 1024);
        if (oversized)
            throw new common_1.BadRequestException('单文件大小不能超过10MB');
        const list = await this.svc.saveTaxFiles(id, files.map((f) => ({
            buffer: f.buffer,
            mimetype: f.mimetype,
            originalname: f.originalname,
        })));
        await this.logRepo.save(this.logRepo.create({
            module: 'file',
            action: 'upload',
            refId: id,
            operator: 'system',
            detail: JSON.stringify({ type: 'tax', count: files.length, category: 'outbound' }),
        }));
        const base = process.env.FILE_BASE || '';
        return list.map((x) => ({
            ...x,
            path: base ? `${base}${x.path}` : x.path,
        }));
    }
    async uploadOtherForReceivable(id, files) {
        if (!files || !files.length)
            throw new common_1.BadRequestException('未选择文件');
        const oversized = files.find((f) => f.size > 20 * 1024 * 1024);
        if (oversized)
            throw new common_1.BadRequestException('单文件大小不能超过20MB');
        const list = await this.svc.saveOtherFiles(id, files.map((f) => ({
            buffer: f.buffer,
            mimetype: f.mimetype,
            originalname: f.originalname,
        })));
        await this.logRepo.save(this.logRepo.create({
            module: 'file',
            action: 'upload',
            refId: id,
            operator: 'system',
            detail: JSON.stringify({ type: 'other', count: files.length }),
        }));
        const base = process.env.FILE_BASE || '';
        return list.map((x) => ({
            ...x,
            path: base ? `${base}${x.path}` : x.path,
        }));
    }
    async uploadTaxForPayable(id, files) {
        if (!files || !files.length)
            throw new common_1.BadRequestException('未选择文件');
        const oversized = files.find((f) => f.size > 10 * 1024 * 1024);
        if (oversized)
            throw new common_1.BadRequestException('单文件大小不能超过10MB');
        const list = await this.svc.saveTaxFiles(id, files.map((f) => ({
            buffer: f.buffer,
            mimetype: f.mimetype,
            originalname: f.originalname,
        })));
        await this.logRepo.save(this.logRepo.create({
            module: 'file',
            action: 'upload',
            refId: id,
            operator: 'system',
            detail: JSON.stringify({ type: 'tax', count: files.length }),
        }));
        const base = process.env.FILE_BASE || '';
        return list.map((x) => ({
            ...x,
            path: base ? `${base}${x.path}` : x.path,
        }));
    }
    async uploadOtherForPayable(id, files) {
        if (!files || !files.length)
            throw new common_1.BadRequestException('未选择文件');
        const oversized = files.find((f) => f.size > 20 * 1024 * 1024);
        if (oversized)
            throw new common_1.BadRequestException('单文件大小不能超过20MB');
        const list = await this.svc.saveOtherFiles(id, files.map((f) => ({
            buffer: f.buffer,
            mimetype: f.mimetype,
            originalname: f.originalname,
        })));
        await this.logRepo.save(this.logRepo.create({
            module: 'file',
            action: 'upload',
            refId: id,
            operator: 'system',
            detail: JSON.stringify({ type: 'other', count: files.length }),
        }));
        const base = process.env.FILE_BASE || '';
        return list.map((x) => ({
            ...x,
            path: base ? `${base}${x.path}` : x.path,
        }));
    }
    async deleteTax(id) {
        const item = await this.svc.deleteTaxById(id);
        if (item)
            await this.logRepo.save(this.logRepo.create({
                module: 'file',
                action: 'delete',
                refId: item.refId,
                operator: 'system',
                detail: JSON.stringify({ type: 'tax', id }),
            }));
        return { success: true };
    }
    async deleteOther(id) {
        const item = await this.svc.deleteOtherById(id);
        if (item)
            await this.logRepo.save(this.logRepo.create({
                module: 'file',
                action: 'delete',
                refId: item.refId,
                operator: 'system',
                detail: JSON.stringify({ type: 'other', id }),
            }));
        return { success: true };
    }
    async downloadTax(file, res) {
        const item = await this.svc.getTaxByFileName(file);
        if (!item)
            throw new common_1.BadRequestException('文件不存在');
        const fs = await Promise.resolve().then(() => require('fs'));
        const path = require('path').join(process.cwd(), 'server_uploads', 'finance', 'tax', file);
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Content-Disposition', `inline; filename="${file}"`);
        const stream = fs.createReadStream(path);
        stream.pipe(res);
    }
    async downloadOther(file, res) {
        const item = await this.svc.getOtherByFileName(file);
        if (!item)
            throw new common_1.BadRequestException('文件不存在');
        const fs = await Promise.resolve().then(() => require('fs'));
        const path = require('path').join(process.cwd(), 'server_uploads', 'finance', 'other', file);
        res.setHeader('Content-Type', item.mimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(item.originalName)}"`);
        const stream = fs.createReadStream(path);
        stream.pipe(res);
    }
};
exports.AttachmentsController = AttachmentsController;
__decorate([
    (0, common_1.Post)('receivable/:id/attachments/tax-invoice'),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10)),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: { files: { type: 'string', format: 'binary' } },
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "uploadTaxForReceivable", null);
__decorate([
    (0, common_1.Post)('inbound/:id/attachments/tax-invoice'),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10)),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: { files: { type: 'string', format: 'binary' } },
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "uploadTaxForInbound", null);
__decorate([
    (0, common_1.Post)('outbound/:id/attachments/tax-invoice'),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10)),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: { files: { type: 'string', format: 'binary' } },
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "uploadTaxForOutbound", null);
__decorate([
    (0, common_1.Post)('receivable/:id/attachments/other'),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 20)),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: { files: { type: 'string', format: 'binary' } },
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "uploadOtherForReceivable", null);
__decorate([
    (0, common_1.Post)('payable/:id/attachments/tax-invoice'),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10)),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: { files: { type: 'string', format: 'binary' } },
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "uploadTaxForPayable", null);
__decorate([
    (0, common_1.Post)('payable/:id/attachments/other'),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 20)),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: { files: { type: 'string', format: 'binary' } },
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "uploadOtherForPayable", null);
__decorate([
    (0, common_1.Delete)('attachments/tax/:id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "deleteTax", null);
__decorate([
    (0, common_1.Delete)('attachments/other/:id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "deleteOther", null);
__decorate([
    (0, common_1.Get)('attachments/tax/:file/download'),
    __param(0, (0, common_1.Param)('file')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "downloadTax", null);
__decorate([
    (0, common_1.Get)('attachments/other/:file/download'),
    __param(0, (0, common_1.Param)('file')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "downloadOther", null);
exports.AttachmentsController = AttachmentsController = __decorate([
    (0, swagger_1.ApiTags)('finance-attachments'),
    (0, common_1.Controller)('finance'),
    __param(1, (0, typeorm_1.InjectRepository)(operation_log_entity_1.OperationLog)),
    __metadata("design:paramtypes", [attachments_service_1.AttachmentsService,
        typeorm_2.Repository])
], AttachmentsController);
//# sourceMappingURL=attachments.controller.js.map