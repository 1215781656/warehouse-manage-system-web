import { Controller, Get } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { UseGuards } from '@nestjs/common';
import { RoleEnum } from './role.enum';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  @Get()
  findAll() {
    return [
      { id: RoleEnum.ADMIN, code: RoleEnum.ADMIN, name: '管理员' },
      { id: RoleEnum.EMPLOYEE, code: RoleEnum.EMPLOYEE, name: '员工' },
    ];
  }
}
