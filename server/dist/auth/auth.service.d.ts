import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private readonly users;
    private readonly jwt;
    constructor(users: Repository<User>, jwt: JwtService);
    validateUser(username: string, password: string): Promise<User | null>;
    issueToken(user: User): Promise<{
        access_token: string;
    }>;
}
