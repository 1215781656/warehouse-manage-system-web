import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ColorFabric } from './fabric/color-fabric.entity';
import { InboundOrder } from './inbound/inbound.entity';
import { OutboundOrder } from './outbound/outbound.entity';
import { Inventory } from './stock/inventory.entity';
import { InboundController } from './inbound/inbound.controller';
import { OutboundController } from './outbound/outbound.controller';
import { StockController } from './stock/stock.controller';
import { ColorFabricController } from './fabric/color-fabric.controller';
import { OperationLog } from '../system/operation-log.entity';
import { InventoryController } from './inventory.controller';
import { TransactionsController } from './transactions.controller';
import { InboundBatch } from './inbound/inbound-batch.entity';
import { Receivable } from '../finance/receivable/receivable.entity';
import { Payable } from '../finance/payable/payable.entity';
import { TaxInvoiceAttachment } from '../finance/attachments/tax-invoice-attachment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ColorFabric,
      InboundOrder,
      OutboundOrder,
      Inventory,
      OperationLog,
      InboundBatch,
      Receivable,
      Payable,
      TaxInvoiceAttachment,
    ]),
  ],
  controllers: [
    InboundController,
    OutboundController,
    StockController,
    ColorFabricController,
    InventoryController,
    TransactionsController,
  ],
})
export class InventoryModule {}
