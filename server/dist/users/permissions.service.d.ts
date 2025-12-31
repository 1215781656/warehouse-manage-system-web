import { Repository } from 'typeorm';
import { Permission } from './permission.entity';
export declare class PermissionsService {
    private permissionsRepository;
    constructor(permissionsRepository: Repository<Permission>);
    findAll(): Promise<Permission[]>;
    create(permission: Partial<Permission>): Promise<Partial<Permission> & Permission>;
    update(id: string, permission: Partial<Permission>): Promise<Permission | null>;
    remove(id: string): Promise<import("typeorm").DeleteResult>;
}
