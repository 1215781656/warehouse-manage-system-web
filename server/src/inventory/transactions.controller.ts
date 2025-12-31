import { Controller, Get, UseGuards } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { InboundOrder } from './inbound/inbound.entity'
import { OutboundOrder } from './outbound/outbound.entity'
import { JwtAuthGuard } from '../auth/jwt.guard'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(
    @InjectRepository(InboundOrder) private readonly inboundRepo: Repository<InboundOrder>,
    @InjectRepository(OutboundOrder) private readonly outboundRepo: Repository<OutboundOrder>,
  ) {}

  @Get()
  async list() {
    const inbound = await this.inboundRepo.find({ relations: ['colorFabric'] })
    const outbound = await this.outboundRepo.find({ relations: ['colorFabric'] })
    return { inbound, outbound }
  }
}
