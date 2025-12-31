import { Permission } from './permission.entity';
import { RoleEnum } from './role.enum';
export declare class User {
    id: string;
    username: string;
    passwordHash: string;
    isActive: boolean;
    avatar: string;
    role: RoleEnum;
    permissions: Permission[];
}
