import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InboundOrder } from '../../inventory/inbound/inbound.entity';

@Entity('payable')
export class Payable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => InboundOrder)
  @JoinColumn({ name: 'inbound_order_id' })
  inboundOrder: InboundOrder;

  @Column({ type: 'date', nullable: true })
  inboundDate: string;

  @Column({ nullable: true })
  inboundNo: string;

  @Column()
  supplier: string;

  @Column({ nullable: true })
  productSpec: string;

  @Column({ nullable: true })
  code: string;

  @Column({ nullable: true })
  composition: string;

  @Column({ nullable: true })
  color: string;

  @Column({ nullable: true })
  craft: string;

  @Column({ name: 'fabric_weight', nullable: true })
  fabricWeight: string;

  @Column({ name: 'customer_remark', nullable: true })
  customerRemark: string;

  @Column('int', { name: 'piece_count', nullable: true })
  pieceCount: number;

  @Column('decimal', { name: 'total_weight', precision: 10, scale: 2, nullable: true })
  totalWeight: string;

  @Column('decimal', { name: 'unit_price', precision: 10, scale: 2, nullable: true })
  unitPrice: string;

  @Column('decimal', { precision: 10, scale: 2 })
  payableAmount: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  paidAmount: string;

  @Column('decimal', { precision: 10, scale: 2 })
  unpaidAmount: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  taxInvoiceAmount: string;

  @Column({ nullable: true })
  source: string;

  @Column({ nullable: true })
  sourceId: string;

  @Column('text', { nullable: true })
  remark: string;

  @Column({ type: 'datetime', nullable: true })
  deletedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  createdAt: Date;

  @Column({ type: 'datetime', nullable: true })
  updatedAt: Date;
}
