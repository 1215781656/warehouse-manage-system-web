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
exports.AttachmentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const tax_invoice_attachment_entity_1 = require("./tax-invoice-attachment.entity");
const other_attachment_entity_1 = require("./other-attachment.entity");
const path_1 = require("path");
const fs_1 = require("fs");
let AttachmentsService = class AttachmentsService {
    constructor(taxRepo, otherRepo) {
        this.taxRepo = taxRepo;
        this.otherRepo = otherRepo;
    }
    taxDir() {
        return (0, path_1.join)(process.cwd(), 'server_uploads', 'finance', 'tax');
    }
    otherDir() {
        return (0, path_1.join)(process.cwd(), 'server_uploads', 'finance', 'other');
    }
    async ensureDirs() {
        await fs_1.promises.mkdir(this.taxDir(), { recursive: true });
        await fs_1.promises.mkdir(this.otherDir(), { recursive: true });
    }
    async saveTaxFiles(refId, files) {
        await this.ensureDirs();
        const out = [];
        for (const f of files) {
            const raw = f.originalname || '';
            const decoded = Buffer.from(raw, 'latin1').toString('utf8');
            const orig = (/[ÃÂæçå]/.test(raw) && !/[ÃÂ]/.test(decoded) ? decoded : raw).replace(/[/\\]+/g, '');
            const extFromOrig = orig.includes('.') ? orig.split('.').pop() || '' : '';
            const ext = extFromOrig || f.mimetype.split('/')[1] || 'jpg';
            const base = orig.replace(/\.[^.]+$/, '') || `image`;
            let fname = `${base}.${ext}`;
            try {
                const exists = await fs_1.promises
                    .access((0, path_1.join)(this.taxDir(), fname))
                    .then(() => true)
                    .catch(() => false);
                if (exists)
                    fname = `${base}-${Date.now()}.${ext}`;
            }
            catch { }
            const abs = (0, path_1.join)(this.taxDir(), fname);
            await fs_1.promises.writeFile(abs, f.buffer);
            const path = `/files/finance/tax/${fname}`;
            const saved = await this.taxRepo.save(this.taxRepo.create({ refId, path }));
            out.push(saved);
        }
        return this.taxRepo.find({
            where: { refId },
            order: { uploadedAt: 'DESC' },
        });
    }
    async saveOtherFiles(refId, files) {
        await this.ensureDirs();
        const out = [];
        for (const f of files) {
            const raw = f.originalname || '';
            const decoded = Buffer.from(raw, 'latin1').toString('utf8');
            const orig = (/[ÃÂæçå]/.test(raw) && !/[ÃÂ]/.test(decoded) ? decoded : raw).replace(/[/\\]+/g, '');
            const ext = orig.includes('.') ? orig.split('.').pop() || '' : '';
            const base = orig.replace(/\.[^.]+$/, '') || `file`;
            let fname = ext ? `${base}.${ext}` : base;
            try {
                const exists = await fs_1.promises
                    .access((0, path_1.join)(this.otherDir(), fname))
                    .then(() => true)
                    .catch(() => false);
                if (exists)
                    fname = `${base}-${Date.now()}${ext ? '.' + ext : ''}`;
            }
            catch { }
            const abs = (0, path_1.join)(this.otherDir(), fname);
            await fs_1.promises.writeFile(abs, f.buffer);
            const path = `/files/finance/other/${fname}`;
            const saved = await this.otherRepo.save(this.otherRepo.create({
                refId,
                path,
                originalName: orig,
                mimeType: f.mimetype,
            }));
            out.push(saved);
        }
        return this.otherRepo.find({
            where: { refId },
            order: { uploadedAt: 'DESC' },
        });
    }
    async getTaxByFileName(fileName) {
        return this.taxRepo.findOne({
            where: { path: `/files/finance/tax/${fileName}` },
        });
    }
    async getOtherByFileName(fileName) {
        return this.otherRepo.findOne({
            where: { path: `/files/finance/other/${fileName}` },
        });
    }
    async deleteTaxById(id) {
        const item = await this.taxRepo.findOne({ where: { id } });
        if (!item)
            return;
        await this.taxRepo.delete(id);
        const abs = (0, path_1.join)(this.taxDir(), item.path.split('/').pop() || '');
        try {
            await fs_1.promises.unlink(abs);
        }
        catch { }
        return item;
    }
    async deleteOtherById(id) {
        const item = await this.otherRepo.findOne({ where: { id } });
        if (!item)
            return;
        await this.otherRepo.delete(id);
        const abs = (0, path_1.join)(this.otherDir(), item.path.split('/').pop() || '');
        try {
            await fs_1.promises.unlink(abs);
        }
        catch { }
        return item;
    }
    async listTaxByRef(refId) {
        return this.taxRepo.find({
            where: { refId },
            order: { uploadedAt: 'DESC' },
        });
    }
    async listOtherByRef(refId) {
        return this.otherRepo.find({
            where: { refId },
            order: { uploadedAt: 'DESC' },
        });
    }
};
exports.AttachmentsService = AttachmentsService;
exports.AttachmentsService = AttachmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tax_invoice_attachment_entity_1.TaxInvoiceAttachment)),
    __param(1, (0, typeorm_1.InjectRepository)(other_attachment_entity_1.OtherAttachment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], AttachmentsService);
//# sourceMappingURL=attachments.service.js.map