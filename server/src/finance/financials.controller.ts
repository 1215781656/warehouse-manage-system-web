import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Receivable } from './receivable/receivable.entity';
import { Payable } from './payable/payable.entity';
import { OutboundOrder } from '../inventory/outbound/outbound.entity';
import { InboundOrder } from '../inventory/inbound/inbound.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('financials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('financials')
export class FinancialsController {
  constructor(
    @InjectRepository(Receivable)
    private readonly recRepo: Repository<Receivable>,
    @InjectRepository(Payable) private readonly payRepo: Repository<Payable>,
    @InjectRepository(OutboundOrder)
    private readonly outRepo: Repository<OutboundOrder>,
    @InjectRepository(InboundOrder)
    private readonly inRepo: Repository<InboundOrder>,
  ) {}

  @Get()
  async list() {
    const receivables = await this.recRepo.find({
      relations: ['outboundOrder'],
    });
    const payables = await this.payRepo.find({ relations: ['inboundOrder'] });
    return { receivables, payables };
  }

  @Get('summary')
  async summary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('customer') customer?: string,
  ) {
    const recQb = this.recRepo
      .createQueryBuilder('r')
      .leftJoin('r.outboundOrder', 'out')
      .where('r.deletedAt IS NULL');
    const payQb = this.payRepo
      .createQueryBuilder('p')
      .leftJoin('p.inboundOrder', 'in')
      .where('p.deletedAt IS NULL');
    if (customer) {
      recQb.andWhere('r.customer LIKE :c', { c: `%${customer}%` });
      payQb.andWhere('p.supplier LIKE :c', { c: `%${customer}%` });
    }
    if (startDate) {
      recQb.andWhere('out.outboundDate >= :sd', { sd: startDate });
      payQb.andWhere('in.inboundDate >= :sd', { sd: startDate });
    }
    if (endDate) {
      recQb.andWhere('out.outboundDate <= :ed', { ed: endDate });
      payQb.andWhere('in.inboundDate <= :ed', { ed: endDate });
    }
    const recSum = await recQb
      .select([
        'COALESCE(SUM(CAST(r.receivableAmount AS DECIMAL(20,2))),0) AS totalReceivable',
        'COALESCE(SUM(CAST(r.receivedAmount AS DECIMAL(20,2))),0) AS totalReceived',
        'COALESCE(SUM(CAST(r.unpaidAmount AS DECIMAL(20,2))),0) AS totalUnpaid',
        'COALESCE(SUM(CAST(r.taxInvoiceAmount AS DECIMAL(20,2))),0) AS taxInvoiceTotal',
      ])
      .getRawOne();
    const paySum = await payQb
      .select([
        'COALESCE(SUM(CAST(p.payableAmount AS DECIMAL(20,2))),0) AS totalPayable',
        'COALESCE(SUM(CAST(p.paidAmount AS DECIMAL(20,2))),0) AS totalPaid',
        'COALESCE(SUM(CAST(p.unpaidAmount AS DECIMAL(20,2))),0) AS totalUnpaid',
        'COALESCE(SUM(CAST(p.taxInvoiceAmount AS DECIMAL(20,2))),0) AS taxInvoiceTotal',
      ])
      .getRawOne();
    return {
      receivable: {
        totalReceivable: Number(
          Number(recSum?.totalReceivable || 0).toFixed(2),
        ),
        totalReceived: Number(Number(recSum?.totalReceived || 0).toFixed(2)),
        totalUnpaid: Number(Number(recSum?.totalUnpaid || 0).toFixed(2)),
        taxInvoiceTotal: Number(
          Number(recSum?.taxInvoiceTotal || 0).toFixed(2),
        ),
      },
      payable: {
        totalPayable: Number(Number(paySum?.totalPayable || 0).toFixed(2)),
        totalPaid: Number(Number(paySum?.totalPaid || 0).toFixed(2)),
        totalUnpaid: Number(Number(paySum?.totalUnpaid || 0).toFixed(2)),
        taxInvoiceTotal: Number(
          Number(paySum?.taxInvoiceTotal || 0).toFixed(2),
        ),
      },
      updatedAt: new Date().toISOString(),
    };
  }
}
