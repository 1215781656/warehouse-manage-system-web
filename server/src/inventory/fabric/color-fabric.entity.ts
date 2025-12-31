import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm'

@Entity('color_fabric')
export class ColorFabric {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  colorFabricNo: string

  @Column()
  @Index('idx_cf_product_spec')
  productSpec: string

  @Column()
  @Index('idx_cf_composition')
  composition: string

  @Column('int')
  @Index('idx_cf_weight')
  weight: number

  @Column('int')
  @Index('idx_cf_width')
  width: number

  @Column()
  color: string

  @Column({ length: 10 })
  colorNo: string

  @Column({ length: 20 })
  batchNo: string
}
