import { InboundOrder } from '../../inventory/inbound/inbound.entity';
export declare class Payable {
    id: string;
    inboundOrder: InboundOrder;
    inboundDate: string;
    inboundNo: string;
    supplier: string;
    productSpec: string;
    code: string;
    composition: string;
    color: string;
    craft: string;
    fabricWeight: string;
    customerRemark: string;
    pieceCount: number;
    totalWeight: string;
    unitPrice: string;
    payableAmount: string;
    paidAmount: string;
    unpaidAmount: string;
    taxInvoiceAmount: string;
    source: string;
    sourceId: string;
    remark: string;
    deletedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
