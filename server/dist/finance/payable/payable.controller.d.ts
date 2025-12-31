import { Repository } from 'typeorm';
import { Payable } from './payable.entity';
import { AttachmentsService } from '../attachments/attachments.service';
export declare class PayableController {
    private readonly repo;
    private readonly attachments;
    constructor(repo: Repository<Payable>, attachments: AttachmentsService);
    list(page?: string, pageSize?: string, customer?: string, startDate?: string, endDate?: string): Promise<{
        list: {
            id: any;
            inboundDate: string;
            inboundNo: any;
            supplier: any;
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
            payableAmount: number;
            paidAmount: number;
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
            payable: {
                totalPayable: number;
                totalPaid: number;
                totalUnpaid: number;
                taxInvoiceTotal: number;
            };
        };
        globalSummary: {
            payable: {
                totalPayable: number;
                totalPaid: number;
                totalUnpaid: number;
                taxInvoiceTotal: number;
            };
        };
        updatedAt: string;
    }>;
    create(dto: Partial<Payable>): Promise<Payable[]>;
    detail(id: string): Promise<{
        id: string;
        inboundDate: string;
        inboundNo: string;
        supplier: string;
        code: any;
        colorNo: any;
        batchNo: any;
        productSpec: any;
        composition: any;
        color: any;
        craft: string;
        fabricWeight: any;
        customerRemark: string;
        pieceCount: number;
        totalWeight: number;
        unitPrice: number;
        payableAmount: number;
        paidAmount: number;
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
    update(id: string, dto: Partial<Payable>): Promise<Payable | null>;
}
