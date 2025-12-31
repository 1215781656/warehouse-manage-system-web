import { Controller, Get, UseGuards } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Inventory } from './stock/inventory.entity'
import { JwtAuthGuard } from '../auth/jwt.guard'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(@InjectRepository(Inventory) private readonly repo: Repository<Inventory>) {}

  @Get()
  async list() {
    return this.repo.find({ relations: ['colorFabric'] })
  }
}
