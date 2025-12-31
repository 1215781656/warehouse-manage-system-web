import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Receivable } from './receivable/receivable.entity';
import { Payable } from './payable/payable.entity';
import { OutboundOrder } from '../inventory/outbound/outbound.entity';
import { InboundOrder } from '../inventory/inbound/inbound.entity';
import { ReceivableController } from './receivable/receivable.controller';
import { PayableController } from './payable/payable.controller';
import { FinancialsController } from './financials.controller';
import { TaxInvoiceAttachment } from './attachments/tax-invoice-attachment.entity';
import { OtherAttachment } from './attachments/other-attachment.entity';
import { AttachmentsController } from './attachments/attachments.controller';
import { AttachmentsService } from './attachments/attachments.service';
import { AttachmentsCleanupService } from './attachments/cleanup.service';
import { OperationLog } from '../system/operation-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Receivable,
      Payable,
      OutboundOrder,
      InboundOrder,
      TaxInvoiceAttachment,
      OtherAttachment,
      OperationLog,
    ]),
  ],
  controllers: [
    ReceivableController,
    PayableController,
    FinancialsController,
    AttachmentsController,
  ],
  providers: [AttachmentsService, AttachmentsCleanupService],
})
export class FinanceModule {}
