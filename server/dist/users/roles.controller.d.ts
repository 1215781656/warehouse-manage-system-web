import { RoleEnum } from './role.enum';
export declare class RolesController {
    findAll(): {
        id: RoleEnum;
        code: RoleEnum;
        name: string;
    }[];
}
