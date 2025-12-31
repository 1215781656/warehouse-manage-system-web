import { Repository } from 'typeorm';
import { Receivable } from './receivable.entity';
import { AttachmentsService } from '../attachments/attachments.service';
export declare class ReceivableController {
    private readonly repo;
    private readonly attachments;
    constructor(repo: Repository<Receivable>, attachments: AttachmentsService);
    list(page?: string, pageSize?: string, customer?: string, startDate?: string, endDate?: string): Promise<{
        list: {
            id: any;
            outboundDate: string;
            outboundNo: any;
            deliveryNo: any;
            customer: any;
            code: any;
            productSpec: any;
            composition: any;
            color: any;
            craft: any;
            fabricWeight: any;
            customerRemark: any;
            pieceCount: any;
            totalWeight: number;
            unitPrice: number;
            quantity: number;
            weightKg: number;
            receivableAmount: number;
            receivedAmount: number;
            unpaidAmount: number;
            taxInvoiceAmount: number;
            source: any;
            deletedAt: any;
            remark: any;
        }[];
        total: number;
        page: number;
        pageSize: number;
        pages: number;
        summary: {
            receivable: {
                totalReceivable: number;
                totalReceived: number;
                totalUnpaid: number;
                taxInvoiceTotal: number;
            };
        };
        globalSummary: {
            receivable: {
                totalReceivable: number;
                totalReceived: number;
                totalUnpaid: number;
                taxInvoiceTotal: number;
            };
        };
        updatedAt: string;
    }>;
    create(dto: Partial<Receivable>): Promise<Receivable[]>;
    detail(id: string): Promise<{
        id: string;
        outboundDate: string;
        outboundNo: string;
        customer: string;
        code: string;
        deliveryNo: string;
        productSpec: any;
        composition: any;
        color: any;
        craft: string;
        fabricWeight: any;
        customerRemark: string;
        pieceCount: number;
        totalWeight: number;
        unitPrice: number;
        receivableAmount: number;
        receivedAmount: number;
        unpaidAmount: number;
        taxInvoiceAmount: number;
        remark: any;
        taxAttachments: {
            path: string;
            id: string;
            refId: string;
            uploadedAt: Date;
        }[];
        otherAttachments: {
            path: string;
            id: string;
            refId: string;
            originalName: string;
            mimeType: string;
            uploadedAt: Date;
        }[];
    } | null>;
    update(id: string, dto: Partial<Receivable>): Promise<Receivable | null>;
}
