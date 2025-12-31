"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersSeeder = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./user.entity");
const permission_entity_1 = require("./permission.entity");
const role_enum_1 = require("./role.enum");
const bcrypt = require("bcryptjs");
let UsersSeeder = class UsersSeeder {
    constructor(users, permissions) {
        this.users = users;
        this.permissions = permissions;
    }
    async onModuleInit() {
        const check = await this.permissions.findOne({
            where: { code: 'inventory:in:view' },
        });
        const all = await this.permissions.find();
        if (all.length > 0) {
            await this.permissions.remove(all);
        }
        await this.seedPermissions();
        const adminUser = await this.users.findOne({
            where: { username: 'admin' },
        });
        if (adminUser) {
            adminUser.permissions = await this.permissions.find();
            if (!adminUser.role) {
                adminUser.role = role_enum_1.RoleEnum.ADMIN;
            }
            await this.users.save(adminUser);
        }
        else {
            await this.createAdmin();
        }
    }
    async createAdmin() {
        const pwd = await bcrypt.hash('123456', 10);
        const allPermissions = await this.permissions.find();
        const admin = this.users.create({
            username: 'admin',
            passwordHash: pwd,
            role: role_enum_1.RoleEnum.ADMIN,
            permissions: allPermissions,
        });
        await this.users.save(admin);
    }
    async seedPermissions() {
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
};
exports.UsersSeeder = UsersSeeder;
exports.UsersSeeder = UsersSeeder = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(permission_entity_1.Permission)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], UsersSeeder);
//# sourceMappingURL=seeder.provider.js.map