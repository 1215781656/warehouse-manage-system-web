import { Repository } from 'typeorm';
import { InboundOrder } from './inbound.entity';
import { ColorFabric } from '../fabric/color-fabric.entity';
import { Inventory } from '../stock/inventory.entity';
import { OperationLog } from '../../system/operation-log.entity';
import { InboundBatch } from './inbound-batch.entity';
import { Payable } from '../../finance/payable/payable.entity';
import { TaxInvoiceAttachment } from '../../finance/attachments/tax-invoice-attachment.entity';
export declare class InboundController {
    private readonly repo;
    private readonly fabricRepo;
    private readonly invRepo;
    private readonly logRepo;
    private readonly batchRepo;
    private readonly payableRepo;
    private readonly attRepo;
    constructor(repo: Repository<InboundOrder>, fabricRepo: Repository<ColorFabric>, invRepo: Repository<Inventory>, logRepo: Repository<OperationLog>, batchRepo: Repository<InboundBatch>, payableRepo: Repository<Payable>, attRepo: Repository<TaxInvoiceAttachment>);
    list(supplier?: string, colorNo?: string, keyword?: string, inboundNo?: string, productSpec?: string, composition?: string, dateStart?: string, dateEnd?: string): Promise<InboundOrder[]>;
    detail(id: string): Promise<{
        taxAttachments: TaxInvoiceAttachment[];
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
    } | null>;
    create(dto: Partial<InboundOrder>): Promise<InboundOrder>;
    update(id: string, dto: Partial<InboundOrder>): Promise<any>;
    softDelete(id: string, body: any): Promise<any>;
    batchDetail(id: string): Promise<any>;
    createBatch(body: {
        batch: Partial<InboundBatch>;
        items: Array<Partial<InboundOrder & {
            colorFabric?: Partial<ColorFabric>;
            colorFabricId?: string;
        }>>;
    }): Promise<{
        batch: InboundBatch;
        items: InboundOrder[];
        totalAmount: number;
    }>;
    updateBatch(id: string, body: {
        batch: Partial<InboundBatch>;
        items: Array<Partial<InboundOrder & {
            id?: string;
            colorFabric?: Partial<ColorFabric>;
            colorFabricId?: string;
        }>>;
    }): Promise<any>;
}
