import { Repository } from 'typeorm';
import { Receivable } from './receivable/receivable.entity';
import { Payable } from './payable/payable.entity';
import { OutboundOrder } from '../inventory/outbound/outbound.entity';
import { InboundOrder } from '../inventory/inbound/inbound.entity';
export declare class FinancialsController {
    private readonly recRepo;
    private readonly payRepo;
    private readonly outRepo;
    private readonly inRepo;
    constructor(recRepo: Repository<Receivable>, payRepo: Repository<Payable>, outRepo: Repository<OutboundOrder>, inRepo: Repository<InboundOrder>);
    list(): Promise<{
        receivables: Receivable[];
        payables: Payable[];
    }>;
    summary(startDate?: string, endDate?: string, customer?: string): Promise<{
        receivable: {
            totalReceivable: number;
            totalReceived: number;
            totalUnpaid: number;
            taxInvoiceTotal: number;
        };
        payable: {
            totalPayable: number;
            totalPaid: number;
            totalUnpaid: number;
            taxInvoiceTotal: number;
        };
        updatedAt: string;
    }>;
}
