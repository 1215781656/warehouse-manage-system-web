"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const user_entity_1 = require("./user.entity");
const permission_entity_1 = require("./permission.entity");
const seeder_provider_1 = require("./seeder.provider");
const users_service_1 = require("./users.service");
const users_controller_1 = require("./users.controller");
const permissions_service_1 = require("./permissions.service");
const permissions_controller_1 = require("./permissions.controller");
const roles_controller_1 = require("./roles.controller");
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, permission_entity_1.Permission])],
        providers: [seeder_provider_1.UsersSeeder, users_service_1.UsersService, permissions_service_1.PermissionsService],
        controllers: [users_controller_1.UsersController, permissions_controller_1.PermissionsController, roles_controller_1.RolesController],
        exports: [typeorm_1.TypeOrmModule, users_service_1.UsersService],
    })
], UsersModule);
//# sourceMappingURL=users.module.js.map