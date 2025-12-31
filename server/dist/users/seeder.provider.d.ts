import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Permission } from './permission.entity';
export declare class UsersSeeder implements OnModuleInit {
    private readonly users;
    private readonly permissions;
    constructor(users: Repository<User>, permissions: Repository<Permission>);
    onModuleInit(): Promise<void>;
    createAdmin(): Promise<void>;
    seedPermissions(): Promise<void>;
}
