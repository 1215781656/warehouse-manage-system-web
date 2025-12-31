import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Permission } from './permission.entity';
import { RoleEnum } from './role.enum';
export declare class UsersService {
    private usersRepository;
    private permissionsRepository;
    constructor(usersRepository: Repository<User>, permissionsRepository: Repository<Permission>);
    findAll(): Promise<User[]>;
    findOne(id: string): Promise<User>;
    create(userData: Partial<User> & {
        password?: string;
        role?: RoleEnum;
    }): Promise<User>;
    update(id: string, userData: Partial<User> & {
        password?: string;
        role?: RoleEnum;
        permissionIds?: string[];
    }): Promise<User>;
    remove(id: string): Promise<import("typeorm").DeleteResult>;
    assignPermissions(userId: string, permissionIds: string[]): Promise<User>;
}
