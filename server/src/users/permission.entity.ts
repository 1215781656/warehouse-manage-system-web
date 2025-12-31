import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column()
  type: string; // 'system' | 'menu' | 'button'

  @Column({ nullable: true })
  parentId: string;

  @Column({ nullable: true })
  path: string;

  @Column({ default: 0 })
  order: number;

  @Column({ nullable: true })
  viewPermission: string; // Code of the permission required to view this menu
}
