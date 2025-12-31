import { Repository } from 'typeorm';
import { InboundOrder } from './inbound/inbound.entity';
import { OutboundOrder } from './outbound/outbound.entity';
export declare class TransactionsController {
    private readonly inboundRepo;
    private readonly outboundRepo;
    constructor(inboundRepo: Repository<InboundOrder>, outboundRepo: Repository<OutboundOrder>);
    list(): Promise<{
        inbound: InboundOrder[];
        outbound: OutboundOrder[];
    }>;
}
