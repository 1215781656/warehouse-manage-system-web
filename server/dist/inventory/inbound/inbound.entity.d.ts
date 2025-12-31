import { ColorFabric } from '../fabric/color-fabric.entity';
import { InboundBatch } from './inbound-batch.entity';
export declare class InboundOrder {
    id: string;
    colorFabric: ColorFabric;
    batch: InboundBatch;
    inboundNo: string;
    inboundDate: string;
    supplier: string;
    quantity: number;
    weightKg: string;
    unitPrice: string;
    amount: string;
    operator: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
