import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Permission } from './permission.entity';
import { UsersSeeder } from './seeder.provider';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { RolesController } from './roles.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Permission])],
  providers: [UsersSeeder, UsersService, PermissionsService],
  controllers: [UsersController, PermissionsController, RolesController],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
