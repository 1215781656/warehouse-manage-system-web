import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validateConfig } from './config/validate';
import { User } from './users/user.entity';
import { Permission } from './users/permission.entity';
import { AuthModule } from './auth/auth.module';
import { InboundOrder } from './inventory/inbound/inbound.entity';
import { OutboundOrder } from './inventory/outbound/outbound.entity';
import { Inventory } from './inventory/stock/inventory.entity';
import { Receivable } from './finance/receivable/receivable.entity';
import { Payable } from './finance/payable/payable.entity';
import { ColorFabric } from './inventory/fabric/color-fabric.entity';
import { InventoryModule } from './inventory/inventory.module';
import { FinanceModule } from './finance/finance.module';
import { UsersModule } from './users/users.module';
import { OperationLog } from './system/operation-log.entity';
import { InboundBatch } from './inventory/inbound/inbound-batch.entity';
import { ExportModule } from './export/export.module';
import { TaxInvoiceAttachment } from './finance/attachments/tax-invoice-attachment.entity';
import { OtherAttachment } from './finance/attachments/other-attachment.entity';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateConfig }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST as string,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER as string,
      password: process.env.DB_PASS as string,
      database: process.env.DB_NAME as string,
      charset: 'utf8mb4',
      entities: [
        User,
        Permission,
        ColorFabric,
        InboundOrder,
        InboundBatch,
        OutboundOrder,
        Inventory,
        Receivable,
        Payable,
        OperationLog,
        TaxInvoiceAttachment,
        OtherAttachment,
      ],
      synchronize: true,
      connectTimeout: 10000,
      extra: {
        connectionLimit: 10,
        waitForConnections: true,
        queueLimit: 0,
        allowPublicKeyRetrieval: true,
      },
    }),
    AuthModule,
    InventoryModule,
    FinanceModule,
    UsersModule,
    ExportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
