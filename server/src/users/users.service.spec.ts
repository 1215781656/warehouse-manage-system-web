import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Permission } from './permission.entity';
import { RoleEnum } from './role.enum';
import { Repository } from 'typeorm';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;
  let permissionRepository: Repository<Permission>;

  const mockUserRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  const mockPermissionRepo = {
    findBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: mockPermissionRepo,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    permissionRepository = module.get<Repository<Permission>>(getRepositoryToken(Permission));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('assignPermissions', () => {
    const systemPerm = { id: 'sys1', code: 'system:view', type: 'system' } as Permission;
    const menuPerm = { id: 'menu1', code: 'menu:list', type: 'menu' } as Permission;
    const allPerms = [systemPerm, menuPerm];

    it('should assign all permissions to ADMIN', async () => {
      const adminUser = { 
        id: '1', 
        role: RoleEnum.ADMIN, 
        permissions: [],
        username: 'admin',
        passwordHash: 'hash',
        isActive: true,
        avatar: null
      } as unknown as User;
      
      mockUserRepo.findOne.mockResolvedValue(adminUser);
      mockPermissionRepo.findBy.mockResolvedValue(allPerms);
      mockUserRepo.save.mockImplementation((user) => Promise.resolve(user));

      const result = await service.assignPermissions('1', ['sys1', 'menu1']);

      expect(result.permissions).toHaveLength(2);
      expect(result.permissions).toContain(systemPerm);
      expect(result.permissions).toContain(menuPerm);
    });

    it('should filter out system permissions for EMPLOYEE', async () => {
      const employeeUser = { 
        id: '2', 
        role: RoleEnum.EMPLOYEE, 
        permissions: [],
        username: 'emp',
        passwordHash: 'hash',
        isActive: true,
        avatar: null
      } as unknown as User;
      
      mockUserRepo.findOne.mockResolvedValue(employeeUser);
      mockPermissionRepo.findBy.mockResolvedValue(allPerms);
      mockUserRepo.save.mockImplementation((user) => Promise.resolve(user));

      const result = await service.assignPermissions('2', ['sys1', 'menu1']);

      expect(result.permissions).toHaveLength(1);
      expect(result.permissions).toContain(menuPerm);
      expect(result.permissions).not.toContain(systemPerm);
    });
  });
});
