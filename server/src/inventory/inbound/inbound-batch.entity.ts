import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('inbound_batch')
export class InboundBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  inboundNo: string;

  @Column('date')
  inboundDate: string;

  @Column()
  supplier: string;

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
}
