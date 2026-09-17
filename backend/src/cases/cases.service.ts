import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';
import { OnboardingDto } from './dto/onboarding.dto';

@Injectable()
export class CasesService {
  constructor(private prisma: PrismaService) {}

  async createWithOnboarding(dto: OnboardingDto) {
    if (!dto.acceptsTerms) throw new BadRequestException('Debe aceptar los términos');
    const emailDomain = dto.email.split('@')[1];

    const existing = await this.prisma.company.findFirst({
      where: {
        OR: [
          { email: dto.email },
          { emailDomain },
          { name: { equals: dto.companyName, mode: 'insensitive' } },
          ...(dto.taxId ? [{ taxId: dto.taxId }] : []),
        ],
      },
    });
    if (existing)
      throw new ConflictException('La empresa ya está registrada. Inicie sesión y cree el caso desde su cuenta.');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const role = await this.prisma.role.findUniqueOrThrow({ where: { code: 'MIPYME' } });

    return this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: dto.companyName, taxId: dto.taxId, email: dto.email,
          emailDomain, country: dto.country, city: dto.city,
        },
      });
      const user = await tx.user.create({
        data: {
          email: dto.email, passwordHash, fullName: dto.contactName,
          phone: dto.phone, roleId: role.id,
        },
      });
      const contact = await tx.companyContact.create({
        data: {
          companyId: company.id, userId: user.id, fullName: dto.contactName,
          position: dto.position, email: dto.email, phone: dto.phone, isPrimary: true,
        },
      });

      await this.validateLov(tx, dto);

      const last = await tx.case.findFirst({ orderBy: { id: 'desc' }, select: { caseNumber: true } });
      const seq = last ? parseInt(last.caseNumber.replace('CAS-', ''), 10) + 1 : 1;
      const caso = await tx.case.create({
        data: {
          caseNumber: `CAS-${String(seq).padStart(6, '0')}`,
          companyId: company.id, contactId: contact.id,
          title: dto.title, description: dto.description,
          areaId: dto.areaId, urgencyId: dto.urgencyId, impactId: dto.impactId,
          status: 'CREADO',
        },
      });
      await tx.caseStateHistory.create({
        data: { caseId: caso.id, fromStatus: null, toStatus: 'CREADO', actorId: user.id },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id, action: 'CREATE', entity: 'Case', entityId: caso.id,
          caseId: caso.id, prevState: null, newState: 'CREADO',
          metadata: { caseNumber: caso.caseNumber, source: 'onboarding' },
        },
      });
      return { caseNumber: caso.caseNumber, status: caso.status, email: user.email };
    });
  }

  private async validateLov(
    tx: Prisma.TransactionClient,
    ids: { areaId: number; urgencyId: number; impactId: number },
  ) {
    const values = await tx.lovValue.findMany({
      where: { id: { in: [ids.areaId, ids.urgencyId, ids.impactId] } },
      include: { category: true },
    });
    const byId = new Map(values.map((v) => [v.id, v]));
    const expect = (id: number, category: string) => {
      const v = byId.get(id);
      if (!v) throw new UnprocessableEntityException(`Valor LOV ${id} no existe`);
      if (v.category.code !== category)
        throw new UnprocessableEntityException(`Valor LOV ${id} no pertenece a ${category}`);
      if (!v.active) throw new UnprocessableEntityException(`Valor LOV ${id} está inactivo`);
    };
    expect(ids.areaId, 'AREA_PROBLEMA');
    expect(ids.urgencyId, 'NIVEL_URGENCIA');
    expect(ids.impactId, 'NIVEL_IMPACTO');
  }
}