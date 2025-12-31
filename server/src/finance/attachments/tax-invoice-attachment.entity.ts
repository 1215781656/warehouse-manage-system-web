import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm'

@Entity({ name: 'tax_invoice_attachments' })
export class TaxInvoiceAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index()
  @Column({ type: 'varchar', length: 64 })
  refId: string

  @Column({ type: 'varchar', length: 512 })
  path: string

  @CreateDateColumn()
  uploadedAt: Date
}

