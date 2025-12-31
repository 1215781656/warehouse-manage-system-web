import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Inventory } from './inventory.entity'
import { JwtAuthGuard } from '../../auth/jwt.guard'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

@ApiTags('inventory-stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory/stock')
export class StockController {
  constructor(@InjectRepository(Inventory) private readonly repo: Repository<Inventory>) {}

  @Get()
  async list(
    @Query('productSpec') productSpec?: string,
    @Query('composition') composition?: string,
    @Query('weight') weight?: string,
    @Query('width') width?: string,
    @Query('color') color?: string,
    @Query('colorNo') colorNo?: string,
  ) {
    const qb = this.repo.createQueryBuilder('inv').leftJoinAndSelect('inv.colorFabric', 'cf')
    if (productSpec) qb.andWhere('cf.productSpec = :productSpec', { productSpec })
    if (composition) qb.andWhere('cf.composition = :composition', { composition })
    if (weight !== undefined && weight !== null && weight !== '') qb.andWhere('cf.weight = :weight', { weight: Number(weight) })
    if (width !== undefined && width !== null && width !== '') qb.andWhere('cf.width = :width', { width: Number(width) })
    if (color) qb.andWhere('cf.color LIKE :color', { color: `%${color}%` })
    if (colorNo) qb.andWhere('cf.colorNo LIKE :colorNo', { colorNo: `%${colorNo}%` })
    return qb.orderBy('cf.productSpec', 'ASC').getMany()
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.repo.findOne({ where: { id }, relations: ['colorFabric'] })
  }
}
