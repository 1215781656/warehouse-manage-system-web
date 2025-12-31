import { AttachmentsService } from './attachments.service';
import { Response } from 'express';
import { Repository } from 'typeorm';
import { OperationLog } from '../../system/operation-log.entity';
export declare class AttachmentsController {
    private readonly svc;
    private readonly logRepo;
    constructor(svc: AttachmentsService, logRepo: Repository<OperationLog>);
    uploadTaxForReceivable(id: string, files: Express.Multer.File[]): Promise<{
        path: string;
        id: string;
        refId: string;
        uploadedAt: Date;
    }[]>;
    uploadTaxForInbound(id: string, files: Express.Multer.File[]): Promise<{
        path: string;
        id: string;
        refId: string;
        uploadedAt: Date;
    }[]>;
    uploadTaxForOutbound(id: string, files: Express.Multer.File[]): Promise<{
        path: string;
        id: string;
        refId: string;
        uploadedAt: Date;
    }[]>;
    uploadOtherForReceivable(id: string, files: Express.Multer.File[]): Promise<{
        path: string;
        id: string;
        refId: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
    }[]>;
    uploadTaxForPayable(id: string, files: Express.Multer.File[]): Promise<{
        path: string;
        id: string;
        refId: string;
        uploadedAt: Date;
    }[]>;
    uploadOtherForPayable(id: string, files: Express.Multer.File[]): Promise<{
        path: string;
        id: string;
        refId: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
    }[]>;
    deleteTax(id: string): Promise<{
        success: boolean;
    }>;
    deleteOther(id: string): Promise<{
        success: boolean;
    }>;
    downloadTax(file: string, res: Response): Promise<void>;
    downloadOther(file: string, res: Response): Promise<void>;
}
