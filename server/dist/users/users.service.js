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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./user.entity");
const permission_entity_1 = require("./permission.entity");
const role_enum_1 = require("./role.enum");
const bcrypt = require("bcryptjs");
let UsersService = class UsersService {
    constructor(usersRepository, permissionsRepository) {
        this.usersRepository = usersRepository;
        this.permissionsRepository = permissionsRepository;
    }
    async findAll() {
        return this.usersRepository.find({
            relations: ['permissions'],
        });
    }
    async findOne(id) {
        const user = await this.usersRepository.findOne({
            where: { id },
            relations: ['permissions'],
        });
        if (!user) {
            throw new common_1.NotFoundException(`User #${id} not found`);
        }
        return user;
    }
    async create(userData) {
        if (!userData.username) {
            throw new Error('Username is required');
        }
        const user = new user_entity_1.User();
        user.username = userData.username;
        user.isActive = userData.isActive ?? true;
        if (userData.password) {
            user.passwordHash = await bcrypt.hash(userData.password, 10);
        }
        else {
            throw new Error('Password is required');
        }
        if (userData.role) {
            user.role = userData.role;
        }
        return this.usersRepository.save(user);
    }
    async update(id, userData) {
        const user = await this.findOne(id);
        if (userData.username)
            user.username = userData.username;
        if (userData.isActive !== undefined)
            user.isActive = userData.isActive;
        if (userData.password) {
            user.passwordHash = await bcrypt.hash(userData.password, 10);
        }
        if (userData.role) {
            user.role = userData.role;
        }
        if (userData.permissionIds) {
            user.permissions = await this.permissionsRepository.findBy({
                id: (0, typeorm_2.In)(userData.permissionIds),
            });
        }
        return this.usersRepository.save(user);
    }
    async remove(id) {
        return this.usersRepository.delete(id);
    }
    async assignPermissions(userId, permissionIds) {
        const user = await this.findOne(userId);
        let permissions = await this.permissionsRepository.findBy({
            id: (0, typeorm_2.In)(permissionIds),
        });
        if (user.role !== role_enum_1.RoleEnum.ADMIN) {
            permissions = permissions.filter((p) => p.code !== 'system:menu' &&
                p.code !== 'system:view' &&
                p.type !== 'system');
        }
        user.permissions = permissions;
        return this.usersRepository.save(user);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(permission_entity_1.Permission)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map