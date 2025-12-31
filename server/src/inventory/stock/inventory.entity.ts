import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, Index } from 'typeorm'
import { ColorFabric } from '../fabric/color-fabric.entity'

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @OneToOne(() => ColorFabric)
  @Index('idx_inventory_color_fabric_id')
  @JoinColumn({ name: 'color_fabric_id' })
  colorFabric: ColorFabric

  @Column('int', { default: 0 })
  totalInboundQuantity: number

  @Column('int', { default: 0 })
  totalOutboundQuantity: number

  @Column('int', { default: 0 })
  currentQuantity: number

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalInboundWeight: string

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalOutboundWeight: string

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  currentWeight: string

  @Column('int', { default: 10 })
  safetyStock: number
}
