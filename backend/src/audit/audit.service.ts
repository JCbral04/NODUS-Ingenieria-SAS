import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  log(entry: Prisma.AuditLogUncheckedCreateInput) {
    return this.prisma.auditLog.create({ data: entry });
  }
}