import { Repository } from 'typeorm';
import { OutboundOrder } from './outbound.entity';
import { Inventory } from '../stock/inventory.entity';
import { ColorFabric } from '../fabric/color-fabric.entity';
import { Receivable } from '../../finance/receivable/receivable.entity';
import { TaxInvoiceAttachment } from '../../finance/attachments/tax-invoice-attachment.entity';
export declare class OutboundController {
    private readonly repo;
    private readonly invRepo;
    private readonly fabricRepo;
    private readonly receivableRepo;
    private readonly attRepo;
    constructor(repo: Repository<OutboundOrder>, invRepo: Repository<Inventory>, fabricRepo: Repository<ColorFabric>, receivableRepo: Repository<Receivable>, attRepo: Repository<TaxInvoiceAttachment>);
    list(customer?: string, outboundNo?: string, deliveryNo?: string, colorFabricNo?: string, productSpec?: string, dateStart?: string, dateEnd?: string): Promise<OutboundOrder[]>;
    create(dto: Partial<OutboundOrder>): Promise<OutboundOrder>;
    batchCreate(body: any): Promise<{
        success: boolean;
        items: OutboundOrder[];
    }>;
    detail(id: string): Promise<any>;
    update(id: string, dto: Partial<OutboundOrder>): Promise<any>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
