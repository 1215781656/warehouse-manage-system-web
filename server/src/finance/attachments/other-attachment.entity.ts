import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm'

@Entity({ name: 'other_attachments' })
export class OtherAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index()
  @Column({ type: 'varchar', length: 64 })
  refId: string

  @Column({ type: 'varchar', length: 512 })
  path: string

  @Column({ type: 'varchar', length: 255, charset: 'utf8mb4', collation: 'utf8mb4_unicode_ci' })
  originalName: string

  @Column({ type: 'varchar', length: 128 })
  mimeType: string

  @CreateDateColumn()
  uploadedAt: Date
}
