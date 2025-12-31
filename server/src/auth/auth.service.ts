import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../users/user.entity'
import * as bcrypt from 'bcryptjs'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.users.findOne({ where: { username } })
    if (!user) return null
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return null
    return user
  }

  async issueToken(user: User) {
    // Keep roles as array for compatibility if needed, but updated to use single role
    const payload = { sub: user.id, roles: [user.role] }
    return { access_token: await this.jwt.signAsync(payload) }
  }
}
