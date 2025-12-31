import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Permission } from './permission.entity';
import { RoleEnum } from './role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  passwordHash: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  avatar: string;

  // Replaced ManyToMany Role with single role column
  @Column({
    type: 'enum',
    enum: RoleEnum,
    default: RoleEnum.EMPLOYEE,
  })
  role: RoleEnum;

  @ManyToMany(() => Permission, { eager: true })
  @JoinTable({ name: 'user_permissions' })
  permissions: Permission[];
}
