import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ColorFabric } from '../fabric/color-fabric.entity';
import { InboundBatch } from './inbound-batch.entity';

@Entity('inbound_order')
export class InboundOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ColorFabric)
  @JoinColumn({ name: 'color_fabric_id' })
  colorFabric: ColorFabric;

  @ManyToOne(() => InboundBatch)
  @JoinColumn({ name: 'inbound_batch_id' })
  batch: InboundBatch;

  @Column()
  inboundNo: string;

  @Column('date')
  inboundDate: string;

  @Column()
  supplier: string;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  weightKg: string;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: string;

  @Column()
  operator: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  deletedAt?: Date;
}
