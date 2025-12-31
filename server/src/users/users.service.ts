import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './user.entity';
import { Permission } from './permission.entity';
import { RoleEnum } from './role.enum';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
  ) {}

  async findAll() {
    return this.usersRepository.find({
      relations: ['permissions'],
    });
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  async create(
    userData: Partial<User> & { password?: string; role?: RoleEnum },
  ) {
    if (!userData.username) {
      throw new Error('Username is required');
    }

    const user = new User();
    user.username = userData.username;
    user.isActive = userData.isActive ?? true;

    if (userData.password) {
      user.passwordHash = await bcrypt.hash(userData.password, 10);
    } else {
      throw new Error('Password is required');
    }

    if (userData.role) {
      user.role = userData.role;
    }

    return this.usersRepository.save(user);
  }

  async update(
    id: string,
    userData: Partial<User> & {
      password?: string;
      role?: RoleEnum;
      permissionIds?: string[];
    },
  ) {
    const user = await this.findOne(id);

    if (userData.username) user.username = userData.username;
    if (userData.isActive !== undefined) user.isActive = userData.isActive;
    if (userData.password) {
      user.passwordHash = await bcrypt.hash(userData.password, 10);
    }

    if (userData.role) {
      user.role = userData.role;
    }

    if (userData.permissionIds) {
      user.permissions = await this.permissionsRepository.findBy({
        id: In(userData.permissionIds),
      });
    }

    return this.usersRepository.save(user);
  }

  async remove(id: string) {
    return this.usersRepository.delete(id);
  }

  async assignPermissions(userId: string, permissionIds: string[]) {
    const user = await this.findOne(userId);
    let permissions = await this.permissionsRepository.findBy({
      id: In(permissionIds),
    });

    // STRICT ISOLATION: Employees cannot have system permissions
    if (user.role !== RoleEnum.ADMIN) {
      permissions = permissions.filter(
        (p) =>
          p.code !== 'system:menu' &&
          p.code !== 'system:view' &&
          p.type !== 'system',
      );
    }

    // Optional: If Admin, ensure they HAVE system permissions?
    // Usually backend shouldn't force add unless business logic dictates.
    // The frontend logic we added ensures they are sent.
    // If we want to be super safe, we could check if admin is missing system perms and add them,
    // but maybe the admin explicitly wants to remove them (unlikely given the "disabled" UI).
    // Let's stick to restricting Employee.

    user.permissions = permissions;
    return this.usersRepository.save(user);
  }
}
