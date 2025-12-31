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
var AttachmentsCleanupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentsCleanupService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const tax_invoice_attachment_entity_1 = require("./tax-invoice-attachment.entity");
const other_attachment_entity_1 = require("./other-attachment.entity");
const fs_1 = require("fs");
const path_1 = require("path");
let AttachmentsCleanupService = AttachmentsCleanupService_1 = class AttachmentsCleanupService {
    constructor(taxRepo, otherRepo) {
        this.taxRepo = taxRepo;
        this.otherRepo = otherRepo;
        this.logger = new common_1.Logger(AttachmentsCleanupService_1.name);
    }
    taxDir() { return (0, path_1.join)(process.cwd(), 'server_uploads', 'finance', 'tax'); }
    otherDir() { return (0, path_1.join)(process.cwd(), 'server_uploads', 'finance', 'other'); }
    async dailyCleanup() {
        try {
            await this.cleanupDir(this.taxDir(), 'tax');
            await this.cleanupDir(this.otherDir(), 'other');
        }
        catch (e) {
            this.logger.error(`清理任务失败: ${e?.message || e}`);
        }
    }
    async cleanupDir(dir, type) {
        await fs_1.promises.mkdir(dir, { recursive: true });
        const files = await fs_1.promises.readdir(dir);
        for (const f of files) {
            const rel = `finance/attachments/${type}/${f}`;
            const repo = type === 'tax' ? this.taxRepo : this.otherRepo;
            const found = await repo.findOne({ where: { path: rel } });
            if (!found) {
                await fs_1.promises.unlink((0, path_1.join)(dir, f)).catch(() => { });
                this.logger.log(`已删除无记录文件: ${rel}`);
            }
        }
        const repo = type === 'tax' ? this.taxRepo : this.otherRepo;
        const all = await repo.find();
        for (const r of all) {
            const base = r.path.split('/').pop() || '';
            const exists = await fs_1.promises.access((0, path_1.join)(dir, base)).then(() => true).catch(() => false);
            if (!exists) {
                await repo.delete(r.id);
                this.logger.log(`已清理丢失文件记录: ${r.id}`);
            }
        }
    }
};
exports.AttachmentsCleanupService = AttachmentsCleanupService;
__decorate([
    (0, schedule_1.Cron)('0 3 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AttachmentsCleanupService.prototype, "dailyCleanup", null);
exports.AttachmentsCleanupService = AttachmentsCleanupService = AttachmentsCleanupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tax_invoice_attachment_entity_1.TaxInvoiceAttachment)),
    __param(1, (0, typeorm_1.InjectRepository)(other_attachment_entity_1.OtherAttachment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], AttachmentsCleanupService);
//# sourceMappingURL=cleanup.service.js.map