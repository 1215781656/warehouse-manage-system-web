import { OutboundOrder } from '../../inventory/outbound/outbound.entity';
export declare class Receivable {
    id: string;
    outboundOrder: OutboundOrder;
    outboundDate: string;
    outboundNo: string;
    deliveryNo: string;
    customer: string;
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
    receivableAmount: string;
    receivedAmount: string;
    unpaidAmount: string;
    taxInvoiceAmount: string;
    source: string;
    sourceId: string;
    remark: string;
    deletedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
