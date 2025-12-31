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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColorFabric = void 0;
const typeorm_1 = require("typeorm");
let ColorFabric = class ColorFabric {
};
exports.ColorFabric = ColorFabric;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ColorFabric.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], ColorFabric.prototype, "colorFabricNo", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)('idx_cf_product_spec'),
    __metadata("design:type", String)
], ColorFabric.prototype, "productSpec", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)('idx_cf_composition'),
    __metadata("design:type", String)
], ColorFabric.prototype, "composition", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    (0, typeorm_1.Index)('idx_cf_weight'),
    __metadata("design:type", Number)
], ColorFabric.prototype, "weight", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    (0, typeorm_1.Index)('idx_cf_width'),
    __metadata("design:type", Number)
], ColorFabric.prototype, "width", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ColorFabric.prototype, "color", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10 }),
    __metadata("design:type", String)
], ColorFabric.prototype, "colorNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], ColorFabric.prototype, "batchNo", void 0);
exports.ColorFabric = ColorFabric = __decorate([
    (0, typeorm_1.Entity)('color_fabric')
], ColorFabric);
//# sourceMappingURL=color-fabric.entity.js.map