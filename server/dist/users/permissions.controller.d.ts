import { PermissionsService } from './permissions.service';
import { Permission } from './permission.entity';
export declare class PermissionsController {
    private readonly permissionsService;
    constructor(permissionsService: PermissionsService);
    findAll(): Promise<Permission[]>;
    create(permission: Partial<Permission>): Promise<Partial<Permission> & Permission>;
    update(id: string, permission: Partial<Permission>): Promise<Permission | null>;
    remove(id: string): Promise<import("typeorm").DeleteResult>;
}
