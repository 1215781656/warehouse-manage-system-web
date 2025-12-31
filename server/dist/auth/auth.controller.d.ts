import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    login(req: any): Promise<{
        access_token: string;
    }>;
    me(req: any): Promise<any>;
}
