import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ColorFabric } from '../fabric/color-fabric.entity';

@Entity('outbound_order')
export class OutboundOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ColorFabric)
  @JoinColumn({ name: 'color_fabric_id' })
  colorFabric: ColorFabric;

  @Column({ nullable: true })
  composition: string;

  @Column({ nullable: true })
  color: string;

  @Column({ nullable: true })
  process: string;

  @Column('int', { nullable: true })
  gramWeight: number;

  @Column({ nullable: true })
  customerNote: string;

  @Column({ nullable: true })
  remark: string;

  @Column()
  outboundNo: string;

  @Column({ nullable: true })
  code: string;

  @Column('date')
  outboundDate: string;

  @Column()
  customer: string;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  weightKg: string;

  @Column('json', { nullable: true })
  outboundDetails: number[];

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: string;

  @Column()
  consignee: string;

  @Column({ nullable: true })
  deliveryNo: string;
}
