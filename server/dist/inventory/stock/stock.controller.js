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
exports.StockController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const inventory_entity_1 = require("./inventory.entity");
const jwt_guard_1 = require("../../auth/jwt.guard");
const swagger_1 = require("@nestjs/swagger");
let StockController = class StockController {
    constructor(repo) {
        this.repo = repo;
    }
    async list(productSpec, composition, weight, width, color, colorNo) {
        const qb = this.repo.createQueryBuilder('inv').leftJoinAndSelect('inv.colorFabric', 'cf');
        if (productSpec)
            qb.andWhere('cf.productSpec = :productSpec', { productSpec });
        if (composition)
            qb.andWhere('cf.composition = :composition', { composition });
        if (weight !== undefined && weight !== null && weight !== '')
            qb.andWhere('cf.weight = :weight', { weight: Number(weight) });
        if (width !== undefined && width !== null && width !== '')
            qb.andWhere('cf.width = :width', { width: Number(width) });
        if (color)
            qb.andWhere('cf.color LIKE :color', { color: `%${color}%` });
        if (colorNo)
            qb.andWhere('cf.colorNo LIKE :colorNo', { colorNo: `%${colorNo}%` });
        return qb.orderBy('cf.productSpec', 'ASC').getMany();
    }
    async get(id) {
        return this.repo.findOne({ where: { id }, relations: ['colorFabric'] });
    }
};
exports.StockController = StockController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('productSpec')),
    __param(1, (0, common_1.Query)('composition')),
    __param(2, (0, common_1.Query)('weight')),
    __param(3, (0, common_1.Query)('width')),
    __param(4, (0, common_1.Query)('color')),
    __param(5, (0, common_1.Query)('colorNo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], StockController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StockController.prototype, "get", null);
exports.StockController = StockController = __decorate([
    (0, swagger_1.ApiTags)('inventory-stock'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('inventory/stock'),
    __param(0, (0, typeorm_1.InjectRepository)(inventory_entity_1.Inventory)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], StockController);
//# sourceMappingURL=stock.controller.js.map