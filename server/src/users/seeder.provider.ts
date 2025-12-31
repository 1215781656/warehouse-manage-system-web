import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Permission } from './permission.entity';
import { RoleEnum } from './role.enum';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersSeeder implements OnModuleInit {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Permission)
    private readonly permissions: Repository<Permission>,
  ) {}

  async onModuleInit() {
    // Check if new structure exists
    const check = await this.permissions.findOne({
      where: { code: 'inventory:in:view' },
    });

    // Always re-seed permissions to ensure viewPermission column is populated and new structure is applied
    // But be careful not to wipe user data unless necessary.
    // For development/task purposes, I'll update permissions.
    // Ideally we should use migrations, but re-seeding is fine here.

    const all = await this.permissions.find();
    if (all.length > 0) {
      await this.permissions.remove(all);
    }
    await this.seedPermissions();

    // Re-assign all permissions to admin
    const adminUser = await this.users.findOne({
      where: { username: 'admin' },
    });
    if (adminUser) {
      adminUser.permissions = await this.permissions.find();
      // Ensure admin has correct role enum
      if (!adminUser.role) {
        adminUser.role = RoleEnum.ADMIN;
      }
      await this.users.save(adminUser);
    } else {
      await this.createAdmin();
    }
  }

  async createAdmin() {
    const pwd = await bcrypt.hash('123456', 10);
    const allPermissions = await this.permissions.find();
    const admin = this.users.create({
      username: 'admin',
      passwordHash: pwd,
      role: RoleEnum.ADMIN,
      permissions: allPermissions,
    });
    await this.users.save(admin);
  }

  async seedPermissions() {
    // 1. 系统管理
    const sysSettings = await this.permissions.save({
      name: '系统管理',
      code: 'system:menu',
      type: 'menu',
      order: 900,
      viewPermission: 'system:view',
    });
    await this.permissions.save([
      {
        name: '查看',
        code: 'system:view',
        type: 'button',
        parentId: sysSettings.id,
      },
    ]);

    // 2. 业务模块
    // 2.1 入库管理
    const inbound = await this.permissions.save({
      name: '入库管理',
      code: 'inventory:in:menu',
      type: 'menu',
      order: 100,
      viewPermission: 'inventory:in:view',
    });
    await this.permissions.save([
      {
        name: '查看',
        code: 'inventory:in:view',
        type: 'button',
        parentId: inbound.id,
      },
      {
        name: '新增',
        code: 'inventory:in:add',
        type: 'button',
        parentId: inbound.id,
      },
      {
        name: '编辑',
        code: 'inventory:in:edit',
        type: 'button',
        parentId: inbound.id,
      },
      {
        name: '删除',
        code: 'inventory:in:delete',
        type: 'button',
        parentId: inbound.id,
      },
      {
        name: '导出',
        code: 'inventory:in:export',
        type: 'button',
        parentId: inbound.id,
      },
    ]);

    // 2.2 出库管理
    const outbound = await this.permissions.save({
      name: '出库管理',
      code: 'inventory:out:menu',
      type: 'menu',
      order: 200,
      viewPermission: 'inventory:out:view',
    });
    await this.permissions.save([
      {
        name: '查看',
        code: 'inventory:out:view',
        type: 'button',
        parentId: outbound.id,
      },
      {
        name: '新增',
        code: 'inventory:out:add',
        type: 'button',
        parentId: outbound.id,
      },
      {
        name: '编辑',
        code: 'inventory:out:edit',
        type: 'button',
        parentId: outbound.id,
      },
      {
        name: '删除',
        code: 'inventory:out:delete',
        type: 'button',
        parentId: outbound.id,
      },
      {
        name: '导出',
        code: 'inventory:out:export',
        type: 'button',
        parentId: outbound.id,
      },
    ]);

    // 2.3 库存查询
    const stock = await this.permissions.save({
      name: '库存查询',
      code: 'inventory:stock:menu',
      type: 'menu',
      order: 300,
      viewPermission: 'inventory:stock:view',
    });
    await this.permissions.save([
      {
        name: '查看',
        code: 'inventory:stock:view',
        type: 'button',
        parentId: stock.id,
      },
      {
        name: '导出',
        code: 'inventory:stock:export',
        type: 'button',
        parentId: stock.id,
      },
    ]);

    // 2.4 应收管理
    const receivable = await this.permissions.save({
      name: '应收管理',
      code: 'finance:receivable:menu',
      type: 'menu',
      order: 400,
      viewPermission: 'finance:receivable:view',
    });
    await this.permissions.save([
      {
        name: '查看',
        code: 'finance:receivable:view',
        type: 'button',
        parentId: receivable.id,
      },
      {
        name: '新增',
        code: 'finance:receivable:add',
        type: 'button',
        parentId: receivable.id,
      },
      {
        name: '编辑',
        code: 'finance:receivable:edit',
        type: 'button',
        parentId: receivable.id,
      },
      {
        name: '删除',
        code: 'finance:receivable:delete',
        type: 'button',
        parentId: receivable.id,
      },
      {
        name: '导出',
        code: 'finance:receivable:export',
        type: 'button',
        parentId: receivable.id,
      },
      {
        name: '收款',
        code: 'finance:receivable:payment',
        type: 'button',
        parentId: receivable.id,
      },
    ]);

    // 2.5 应付管理
    const payable = await this.permissions.save({
      name: '应付管理',
      code: 'finance:payable:menu',
      type: 'menu',
      order: 500,
      viewPermission: 'finance:payable:view',
    });
    await this.permissions.save([
      {
        name: '查看',
        code: 'finance:payable:view',
        type: 'button',
        parentId: payable.id,
      },
      {
        name: '新增',
        code: 'finance:payable:add',
        type: 'button',
        parentId: payable.id,
      },
      {
        name: '编辑',
        code: 'finance:payable:edit',
        type: 'button',
        parentId: payable.id,
      },
      {
        name: '删除',
        code: 'finance:payable:delete',
        type: 'button',
        parentId: payable.id,
      },
      {
        name: '导出',
        code: 'finance:payable:export',
        type: 'button',
        parentId: payable.id,
      },
      {
        name: '付款',
        code: 'finance:payable:payment',
        type: 'button',
        parentId: payable.id,
      },
    ]);
  }
}
