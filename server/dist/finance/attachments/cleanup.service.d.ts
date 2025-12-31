import { Repository } from 'typeorm';
import { TaxInvoiceAttachment } from './tax-invoice-attachment.entity';
import { OtherAttachment } from './other-attachment.entity';
export declare class AttachmentsCleanupService {
    private readonly taxRepo;
    private readonly otherRepo;
    private readonly logger;
    constructor(taxRepo: Repository<TaxInvoiceAttachment>, otherRepo: Repository<OtherAttachment>);
    taxDir(): string;
    otherDir(): string;
    dailyCleanup(): Promise<void>;
    private cleanupDir;
}
