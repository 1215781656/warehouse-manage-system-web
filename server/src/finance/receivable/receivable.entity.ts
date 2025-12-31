import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OutboundOrder } from '../../inventory/outbound/outbound.entity';

@Entity('receivable')
export class Receivable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => OutboundOrder)
  @JoinColumn({ name: 'outbound_order_id' })
  outboundOrder: OutboundOrder;

  @Column({ type: 'date', nullable: true })
  outboundDate: string;

  @Column({ nullable: true })
  outboundNo: string;

  @Column({ nullable: true })
  deliveryNo: string;

  @Column()
  customer: string;

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
  receivableAmount: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  receivedAmount: string;

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
