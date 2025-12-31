import { Controller, Get, UseGuards } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ColorFabric } from './color-fabric.entity'
import { JwtAuthGuard } from '../../auth/jwt.guard'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

@ApiTags('color-fabric')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory/color-fabric')
export class ColorFabricController {
  constructor(@InjectRepository(ColorFabric) private readonly repo: Repository<ColorFabric>) {}

  @Get()
  async list() {
    return this.repo.find()
  }
}
