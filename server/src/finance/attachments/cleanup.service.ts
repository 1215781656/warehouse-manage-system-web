import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TaxInvoiceAttachment } from './tax-invoice-attachment.entity'
import { OtherAttachment } from './other-attachment.entity'
import { promises as fs } from 'fs'
import { join } from 'path'

@Injectable()
export class AttachmentsCleanupService {
  private readonly logger = new Logger(AttachmentsCleanupService.name)
  constructor(
    @InjectRepository(TaxInvoiceAttachment) private readonly taxRepo: Repository<TaxInvoiceAttachment>,
    @InjectRepository(OtherAttachment) private readonly otherRepo: Repository<OtherAttachment>
  ) {}

  taxDir() { return join(process.cwd(), 'server_uploads', 'finance', 'tax') }
  otherDir() { return join(process.cwd(), 'server_uploads', 'finance', 'other') }

  @Cron('0 3 * * *')
  async dailyCleanup() {
    try {
      await this.cleanupDir(this.taxDir(), 'tax')
      await this.cleanupDir(this.otherDir(), 'other')
    } catch (e: any) {
      this.logger.error(`清理任务失败: ${e?.message || e}`)
    }
  }

  private async cleanupDir(dir: string, type: 'tax' | 'other') {
    await fs.mkdir(dir, { recursive: true })
    const files = await fs.readdir(dir)
    for (const f of files) {
      const rel = `finance/attachments/${type}/${f}`
      const repo = type === 'tax' ? this.taxRepo : this.otherRepo
      const found = await repo.findOne({ where: { path: rel } })
      if (!found) {
        await fs.unlink(join(dir, f)).catch(() => {})
        this.logger.log(`已删除无记录文件: ${rel}`)
      }
    }
    const repo = type === 'tax' ? this.taxRepo : this.otherRepo
    const all = await repo.find()
    for (const r of all) {
      const base = r.path.split('/').pop() || ''
      const exists = await fs.access(join(dir, base)).then(() => true).catch(() => false)
      if (!exists) {
        await repo.delete(r.id)
        this.logger.log(`已清理丢失文件记录: ${r.id}`)
      }
    }
  }
}

