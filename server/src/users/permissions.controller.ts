import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { Permission } from './permission.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('permissions')
@UseGuards(JwtAuthGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }

  @Post()
  create(@Body() permission: Partial<Permission>) {
    return this.permissionsService.create(permission);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() permission: Partial<Permission>) {
    return this.permissionsService.update(id, permission);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }
}
