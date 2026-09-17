import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private audit: AuditService,
  ) {}

  async login(email: string, password: string, ip?: string) {
    const user = await this.users.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      throw new UnauthorizedException('Credenciales inválidas');
    await this.audit.log({
      actorId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      metadata: { ip: ip ?? 'desconocida' },
    });
    return this.buildTokens(user);
  }

  async refresh(refreshToken: string) {
    let payload: { sub: number; type?: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken);
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
    if (payload.type !== 'refresh')
      throw new UnauthorizedException('Token de tipo incorrecto');
    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException('Usuario no existe');
    return this.buildTokens(user);
  }

  private buildTokens(user: { id: number; email: string; role: { code: string } }) {
    const payload = { sub: user.id, role: user.role.code };
    return {
      accessToken: this.jwt.sign(payload),
      refreshToken: this.jwt.sign({ ...payload, type: 'refresh' }, { expiresIn: '7d' }),
      user: { id: user.id, email: user.email, role: user.role.code },
    };
  }
}
