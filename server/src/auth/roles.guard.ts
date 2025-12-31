import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from './roles.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!required || required.length === 0) return true
    const req = context.switchToHttp().getRequest()
    const user = req.user
    // Check if user.role matches any required role
    if (user && user.role) {
       return required.includes(user.role);
    }
    // Fallback for payload based roles if any (though JwtStrategy loads user)
    const roles: string[] = user?.roles || []
    return required.some(r => roles.includes(r))
  }
}
