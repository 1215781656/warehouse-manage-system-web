import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('operation_log')
export class OperationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  module: string

  @Column()
  action: string

  @Column()
  refId: string

  @Column()
  operator: string

  @Column('text')
  detail: string

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date
}
