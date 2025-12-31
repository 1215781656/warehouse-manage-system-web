import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './permission.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
  ) {}

  async findAll() {
    return this.permissionsRepository.find({ order: { order: 'ASC' } });
  }

  async create(permission: Partial<Permission>) {
    return this.permissionsRepository.save(permission);
  }

  async update(id: string, permission: Partial<Permission>) {
    await this.permissionsRepository.update(id, permission);
    return this.permissionsRepository.findOneBy({ id });
  }

  async remove(id: string) {
    return this.permissionsRepository.delete(id);
  }
}
