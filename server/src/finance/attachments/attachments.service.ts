import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxInvoiceAttachment } from './tax-invoice-attachment.entity';
import { OtherAttachment } from './other-attachment.entity';
import { join } from 'path';
import { promises as fs } from 'fs';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(TaxInvoiceAttachment)
    private readonly taxRepo: Repository<TaxInvoiceAttachment>,
    @InjectRepository(OtherAttachment)
    private readonly otherRepo: Repository<OtherAttachment>,
  ) {}

  taxDir() {
    return join(process.cwd(), 'server_uploads', 'finance', 'tax');
  }
  otherDir() {
    return join(process.cwd(), 'server_uploads', 'finance', 'other');
  }

  async ensureDirs() {
    await fs.mkdir(this.taxDir(), { recursive: true });
    await fs.mkdir(this.otherDir(), { recursive: true });
  }

  async saveTaxFiles(
    refId: string,
    files: Array<{ buffer: Buffer; mimetype: string; originalname: string }>,
  ) {
    await this.ensureDirs();
    const out: TaxInvoiceAttachment[] = [];
    for (const f of files) {
      const raw = f.originalname || '';
      const decoded = Buffer.from(raw, 'latin1').toString('utf8');
      const orig = (
        /[ÃÂæçå]/.test(raw) && !/[ÃÂ]/.test(decoded) ? decoded : raw
      ).replace(/[/\\]+/g, '');
      const extFromOrig = orig.includes('.') ? orig.split('.').pop() || '' : '';
      const ext = extFromOrig || f.mimetype.split('/')[1] || 'jpg';
      const base = orig.replace(/\.[^.]+$/, '') || `image`;
      let fname = `${base}.${ext}`;
      // 避免重名覆盖：若存在则追加时间戳
      try {
        const exists = await fs
          .access(join(this.taxDir(), fname))
          .then(() => true)
          .catch(() => false);
        if (exists) fname = `${base}-${Date.now()}.${ext}`;
      } catch {}
      const abs = join(this.taxDir(), fname);
      await fs.writeFile(abs, f.buffer);
      const path = `/files/finance/tax/${fname}`;
      const saved = await this.taxRepo.save(
        this.taxRepo.create({ refId, path }),
      );
      out.push(saved);
    }
    return this.taxRepo.find({
      where: { refId },
      order: { uploadedAt: 'DESC' },
    });
  }

  async saveOtherFiles(
    refId: string,
    files: Array<{ buffer: Buffer; mimetype: string; originalname: string }>,
  ) {
    await this.ensureDirs();
    const out: OtherAttachment[] = [];
    for (const f of files) {
      const raw = f.originalname || '';
      const decoded = Buffer.from(raw, 'latin1').toString('utf8');
      const orig = (
        /[ÃÂæçå]/.test(raw) && !/[ÃÂ]/.test(decoded) ? decoded : raw
      ).replace(/[/\\]+/g, '');
      const ext = orig.includes('.') ? orig.split('.').pop() || '' : '';
      const base = orig.replace(/\.[^.]+$/, '') || `file`;
      let fname = ext ? `${base}.${ext}` : base;
      try {
        const exists = await fs
          .access(join(this.otherDir(), fname))
          .then(() => true)
          .catch(() => false);
        if (exists) fname = `${base}-${Date.now()}${ext ? '.' + ext : ''}`;
      } catch {}
      const abs = join(this.otherDir(), fname);
      await fs.writeFile(abs, f.buffer);
      const path = `/files/finance/other/${fname}`;
      const saved = await this.otherRepo.save(
        this.otherRepo.create({
          refId,
          path,
          originalName: orig,
          mimeType: f.mimetype,
        }),
      );
      out.push(saved);
    }
    return this.otherRepo.find({
      where: { refId },
      order: { uploadedAt: 'DESC' },
    });
  }

  async getTaxByFileName(fileName: string) {
    return this.taxRepo.findOne({
      where: { path: `/files/finance/tax/${fileName}` },
    });
  }
  async getOtherByFileName(fileName: string) {
    return this.otherRepo.findOne({
      where: { path: `/files/finance/other/${fileName}` },
    });
  }

  async deleteTaxById(id: string) {
    const item = await this.taxRepo.findOne({ where: { id } });
    if (!item) return;
    await this.taxRepo.delete(id);
    const abs = join(this.taxDir(), item.path.split('/').pop() || '');
    try {
      await fs.unlink(abs);
    } catch {}
    return item;
  }
  async deleteOtherById(id: string) {
    const item = await this.otherRepo.findOne({ where: { id } });
    if (!item) return;
    await this.otherRepo.delete(id);
    const abs = join(this.otherDir(), item.path.split('/').pop() || '');
    try {
      await fs.unlink(abs);
    } catch {}
    return item;
  }

  async listTaxByRef(refId: string) {
    return this.taxRepo.find({
      where: { refId },
      order: { uploadedAt: 'DESC' },
    });
  }
  async listOtherByRef(refId: string) {
    return this.otherRepo.find({
      where: { refId },
      order: { uploadedAt: 'DESC' },
    });
  }
}
