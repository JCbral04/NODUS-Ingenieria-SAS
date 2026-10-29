import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { UsersModule } from '../users/users.module';
import { AuditModule } from '../audit/audit.module';
import type { SignOptions } from 'jsonwebtoken';

const jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? '1h';
if (!/^\d+[smhd]$/.test(jwtExpiresIn)) {
  throw new Error(`JWT_EXPIRES_IN inválido: "${jwtExpiresIn}". Formato: número + s|m|h|d (ej: "1h")`);
}

@Module({
  imports: [
    UsersModule,
    AuditModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: jwtExpiresIn as SignOptions['expiresIn'] },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RolesGuard],
  exports: [JwtAuthGuard, RolesGuard, JwtModule],
})
export class AuthModule {}