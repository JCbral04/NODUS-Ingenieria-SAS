import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';
import { OnboardingDto } from './dto/onboarding.dto';
import { CreateClassificationDto } from './dto/classification.dto';
import { ApplyDto } from './dto/apply.dto';
import { WorkflowService } from '../workflow/workflow.service';

@Injectable()
export class CasesService {
  constructor(
    private prisma: PrismaService,
    private workflow: WorkflowService,
  ) {}

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

      await this.validateLovSet(tx, [
        [dto.areaId, 'AREA_PROBLEMA'],
        [dto.urgencyId, 'NIVEL_URGENCIA'],
        [dto.impactId, 'NIVEL_IMPACTO'],
      ]);

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

  async classify(caseId: number, actorId: number, dto: CreateClassificationDto) {
    const caso = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!caso) throw new NotFoundException('Caso no existe');
    if (caso.status !== 'EN_REVISION')
      throw new UnprocessableEntityException(`Solo se clasifica en EN_REVISION (estado actual: ${caso.status})`);

    await this.validateLovSet(this.prisma, [
      [dto.areaId, 'AREA_PROBLEMA'],
      [dto.interventionTypeId, 'TIPO_INTERVENCION'],
      [dto.complexityId, 'NIVEL_COMPLEJIDAD'],
      [dto.impactId, 'NIVEL_IMPACTO'],
    ]);

    const classification = await this.prisma.caseClassification.create({
      data: {
        caseId,
        areaId: dto.areaId,
        interventionTypeId: dto.interventionTypeId,
        complexityId: dto.complexityId,
        impactId: dto.impactId,
        eligibilityNotes: dto.notes ?? null,
        isEligible: dto.isEligible,
        classifiedById: actorId,
      },
    });

    let updated = caso;
    if (dto.isEligible) {
      updated = await this.workflow.transition(caseId, 'CLASIFICADO', actorId, 'Caso habilitado tras clasificación T2');
    }

    return { classification, case: updated };
  }

  async listForUser(userId: number, role: string) {
    const base = {
      include: {
        company: { select: { name: true } },
        area: { select: { label: true } },
        urgency: { select: { label: true } },
        impact: { select: { label: true } },
      },
      orderBy: { createdAt: 'desc' as const },
    };
    if (role === 'ADVISORY' || role === 'ADMIN') return this.prisma.case.findMany(base);
    if (role === 'MIPYME') {
      const contact = await this.prisma.companyContact.findFirst({ where: { userId } });
      if (!contact) return [];
      return this.prisma.case.findMany({ ...base, where: { companyId: contact.companyId } });
    }
    if (role === 'CONSULTOR')
      return this.prisma.case.findMany({ ...base, where: { assignedConsultant: { userId } } });
    return [];
  }

  async detail(id: number) {
    const caso = await this.prisma.case.findUnique({
      where: { id },
      include: {
        company: true,
        contact: true,
        area: true, urgency: true, impact: true,
        classifications: {
          include: { area: true, interventionType: true, complexity: true, impact: true },
          orderBy: { createdAt: 'desc' },
        },
        stateHistory: {
          orderBy: { createdAt: 'desc' },
          include: { actor: { select: { fullName: true } } },
        },
        assignedConsultant: { include: { user: { select: { fullName: true } } } },
      },
    });
    if (!caso) throw new NotFoundException('Caso no existe');
    const auditLog = await this.prisma.auditLog.findMany({
      where: { caseId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { actor: { select: { fullName: true } } },
    });
    return { ...caso, auditLog };
  }

  async publish(caseId: number, actorId: number) {
    return this.workflow.transition(caseId, 'EN_POSTULACION', actorId, 'Caso publicado en la bolsa interna');
  }

  async pool(userId: number) {
    const consultant = await this.prisma.consultant.findUnique({
      where: { userId },
      include: { specialty: true },
    });
    if (!consultant || consultant.status !== 'HABILITADO' || !consultant.availability)
      throw new ForbiddenException('Consultor no habilitado o sin disponibilidad');

    const cases = await this.prisma.case.findMany({
      where: {
        status: 'EN_POSTULACION',
        classifications: { some: { areaId: consultant.specialtyId ?? -1, isEligible: true } },
      },
      include: {
        area: { select: { label: true } },
        urgency: { select: { label: true } },
        classifications: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            interventionType: { select: { label: true } },
            complexity: { select: { label: true } },
          },
        },
      },
      orderBy: { statusChangedAt: 'desc' },
    });

    return cases.map((c) => ({
      id: c.id,
      caseNumber: c.caseNumber,
      title: c.title,
      area: c.area?.label,
      urgency: c.urgency?.label,
      interventionType: c.classifications[0]?.interventionType?.label,
      complexity: c.classifications[0]?.complexity?.label,
      publishedAt: c.statusChangedAt,
    }));
  }

  async apply(userId: number, caseId: number, dto: ApplyDto) {
    const consultant = await this.prisma.consultant.findUnique({ where: { userId } });
    if (!consultant || consultant.status !== 'HABILITADO')
      throw new ForbiddenException('Consultor no habilitado en el ecosistema');

    const caso = await this.prisma.case.findUnique({
      where: { id: caseId },
      include: { classifications: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!caso) throw new NotFoundException('Caso no existe');
    if (caso.status !== 'EN_POSTULACION')
      throw new UnprocessableEntityException(`El caso no está en postulación (estado: ${caso.status})`);

    const lastClassification = caso.classifications[0];
    if (!lastClassification || lastClassification.areaId !== consultant.specialtyId)
      throw new ForbiddenException('No eres elegible para este caso (especialidad no coincide)');

    let application;
    try {
      application = await this.prisma.application.create({
        data: {
          caseId,
          consultantId: consultant.id,
          interestStatement: dto.interestStatement,
          isAvailable: dto.isAvailable,
          relevance: dto.relevance,
          relevantExperience: dto.relevantExperience,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')
        throw new ConflictException('Ya te postulaste a este caso');
      throw e;
    }
    await this.prisma.auditLog.create({
      data: {
        actorId: userId, action: 'APPLY', entity: 'Application', entityId: application.id,
        caseId, prevState: null, newState: 'POSTULADO',
        metadata: { consultantId: consultant.id },
      },
    });
    return application;
  }

  private async validateLovSet(
    db: PrismaService | Prisma.TransactionClient,
    checks: Array<[number, string]>,
  ) {
    const ids = checks.map(([id]) => id);
    const values = await db.lovValue.findMany({
      where: { id: { in: ids } },
      include: { category: true },
    });
    const byId = new Map(values.map((v) => [v.id, v]));
    for (const [id, category] of checks) {
      const v = byId.get(id);
      if (!v) throw new UnprocessableEntityException(`Valor LOV ${id} no existe`);
      if (v.category.code !== category)
        throw new UnprocessableEntityException(`Valor LOV ${id} no pertenece a ${category}`);
      if (!v.active) throw new UnprocessableEntityException(`Valor LOV ${id} está inactivo`);
    }
  }
}
