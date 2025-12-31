import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ExportController,
  ReportExportController,
  ReportControllerAlias,
} from './export.controller';
import { ExportService } from './export.service';
import { InboundOrder } from '../inventory/inbound/inbound.entity';
import { OutboundOrder } from '../inventory/outbound/outbound.entity';
import { Inventory } from '../inventory/stock/inventory.entity';
import { ColorFabric } from '../inventory/fabric/color-fabric.entity';
import { Receivable } from '../finance/receivable/receivable.entity';
import { Payable } from '../finance/payable/payable.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InboundOrder,
      OutboundOrder,
      Inventory,
      ColorFabric,
      Receivable,
      Payable,
    ]),
  ],
  controllers: [
    ExportController,
    ReportExportController,
    ReportControllerAlias,
  ],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
