import { UsersService } from './users.service';
import { User } from './user.entity';
export declare class UsersController {
    private readonly usersService;
    private readonly logger;
    constructor(usersService: UsersService);
    findAll(): Promise<User[]>;
    findOne(id: string): Promise<User>;
    create(userData: any): Promise<User>;
    update(id: string, userData: any): Promise<User>;
    remove(id: string): Promise<import("typeorm").DeleteResult>;
    assignPermissions(id: string, permissionIds: string[]): Promise<User>;
}
