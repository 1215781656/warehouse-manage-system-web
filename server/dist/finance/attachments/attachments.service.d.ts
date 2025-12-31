import { Repository } from 'typeorm';
import { TaxInvoiceAttachment } from './tax-invoice-attachment.entity';
import { OtherAttachment } from './other-attachment.entity';
export declare class AttachmentsService {
    private readonly taxRepo;
    private readonly otherRepo;
    constructor(taxRepo: Repository<TaxInvoiceAttachment>, otherRepo: Repository<OtherAttachment>);
    taxDir(): string;
    otherDir(): string;
    ensureDirs(): Promise<void>;
    saveTaxFiles(refId: string, files: Array<{
        buffer: Buffer;
        mimetype: string;
        originalname: string;
    }>): Promise<TaxInvoiceAttachment[]>;
    saveOtherFiles(refId: string, files: Array<{
        buffer: Buffer;
        mimetype: string;
        originalname: string;
    }>): Promise<OtherAttachment[]>;
    getTaxByFileName(fileName: string): Promise<TaxInvoiceAttachment | null>;
    getOtherByFileName(fileName: string): Promise<OtherAttachment | null>;
    deleteTaxById(id: string): Promise<TaxInvoiceAttachment | undefined>;
    deleteOtherById(id: string): Promise<OtherAttachment | undefined>;
    listTaxByRef(refId: string): Promise<TaxInvoiceAttachment[]>;
    listOtherByRef(refId: string): Promise<OtherAttachment[]>;
}
