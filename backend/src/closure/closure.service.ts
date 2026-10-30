import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EvaluationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { WorkflowService } from '../workflow/workflow.service';
import { AcceptClosureDto } from './dto/accept-closure.dto';
import { EvaluateClosureDto } from './dto/evaluate-closure.dto';
import { ReviewClosureDto } from './dto/review-closure.dto';
import { TechnicalClosureDto } from './dto/technical-closure.dto';

type Actor = {
  userId: number;
  role: string;
};

@Injectable()
export class ClosureService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workflow: WorkflowService,
  ) {}

  async detail(actor: Actor, caseId: number) {
    const caso = await this.loadCase(caseId);
    await this.authorizeRead(actor, caso);

    const [closure, evaluations, deliverables] = await Promise.all([
      this.prisma.caseClosure.findUnique({ where: { caseId } }),
      this.prisma.evaluation.findMany({
        where: { caseId },
        include: {
          evaluator: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.deliverable.findMany({
        where: {
          caseId,
          status: { in: ['CARGADO', 'APROBADO'] },
        },
        orderBy: [{ title: 'asc' }, { version: 'desc' }],
      }),
    ]);

    return { closure, evaluations, deliverables };
  }

  async technical(
    actor: Actor,
    caseId: number,
    dto: TechnicalClosureDto,
  ) {
    const caso = await this.loadCase(caseId);
    this.authorizeConsultant(actor, caso);

    if (
      caso.status !== 'EN_EJECUCION' &&
      caso.status !== 'LISTO_PARA_CIERRE'
    ) {
      throw new UnprocessableEntityException(
        'El caso no está en ejecución',
      );
    }

    await this.ensureFinalDeliverables(caseId);

    const existing = await this.prisma.caseClosure.findUnique({
      where: { caseId },
    });

    if (existing && existing.stage !== 'CIERRE_TECNICO') {
      throw new UnprocessableEntityException(
        'El cierre técnico ya fue superado',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const closure = await tx.caseClosure.upsert({
        where: { caseId },
        create: {
          caseId,
          stage: 'CIERRE_TECNICO',
          technicalNotes: dto.technicalNotes,
        },
        update: {
          stage: 'CIERRE_TECNICO',
          technicalNotes: dto.technicalNotes,
        },
      });

      if (caso.status === 'EN_EJECUCION') {
        await this.workflow.transition(
          caseId,
          'LISTO_PARA_CIERRE',
          actor.userId,
          'Cierre técnico declarado por el consultor',
          tx,
        );
      }

      await this.audit(
        tx,
        actor.userId,
        'TECHNICAL_CLOSE',
        'CaseClosure',
        closure.id,
        caseId,
        existing?.stage ?? null,
        closure.stage,
      );

      return closure;
    });
  }

  async review(
    actor: Actor,
    caseId: number,
    dto: ReviewClosureDto,
  ) {
    const caso = await this.loadCase(caseId);
    this.authorizeAdvisory(actor);

    const closure = await this.closureOrThrow(caseId);
    this.ensureStage(closure.stage, 'CIERRE_TECNICO');

    if (
      !dto.deliverablesFinal ||
      !dto.incidentsResolved ||
      !dto.documentationComplete
    ) {
      throw new UnprocessableEntityException(
        'El checklist T9C debe estar completamente aprobado',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.caseClosure.update({
        where: { caseId },
        data: {
          stage: 'REVISADO',
          reviewChecklist: {
            deliverablesFinal: dto.deliverablesFinal,
            incidentsResolved: dto.incidentsResolved,
            documentationComplete: dto.documentationComplete,
            observations: dto.observations ?? null,
          },
        },
      });

      await this.audit(
        tx,
        actor.userId,
        'FINAL_REVIEW',
        'CaseClosure',
        closure.id,
        caseId,
        closure.stage,
        updated.stage,
      );

      return updated;
    });
  }

  async delivery(actor: Actor, caseId: number) {
    await this.loadCase(caseId);
    this.authorizeAdvisory(actor);

    const closure = await this.closureOrThrow(caseId);
    this.ensureStage(closure.stage, 'REVISADO');

    const caso = await this.prisma.case.findUniqueOrThrow({
      where: { id: caseId },
      select: { caseNumber: true, title: true },
    });

    const deliverables = await this.prisma.deliverable.findMany({
      where: {
        caseId,
        status: { in: ['CARGADO', 'APROBADO'] },
      },
      orderBy: [{ title: 'asc' }, { version: 'desc' }],
    });

    if (!deliverables.length) {
      throw new UnprocessableEntityException(
        'No hay entregables finales para el acta',
      );
    }

    const lines = deliverables.map(
      (item) => `- ${item.title} (versión ${item.version})`,
    );

    const deliveryAct = [
      `ACTA DE ENTREGA — ${caso.caseNumber}`,
      `Caso: ${caso.title}`,
      `Fecha: ${new Date().toISOString()}`,
      'Entregables:',
      ...lines,
    ].join('\n');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.caseClosure.update({
        where: { caseId },
        data: {
          stage: 'ENTREGADO',
          deliveryAct,
        },
      });

      await this.audit(
        tx,
        actor.userId,
        'DELIVERY_ACT',
        'CaseClosure',
        closure.id,
        caseId,
        closure.stage,
        updated.stage,
      );

      return updated;
    });
  }

  async accept(
    actor: Actor,
    caseId: number,
    dto: AcceptClosureDto,
  ) {
    const caso = await this.loadCase(caseId);
    await this.authorizeClient(actor, caso.companyId);

    const closure = await this.closureOrThrow(caseId);
    this.ensureStage(closure.stage, 'ENTREGADO');

    const stage = dto.accepted ? 'ACEPTADO' : 'ENTREGADO';

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.caseClosure.update({
        where: { caseId },
        data: {
          stage,
          acceptanceNotes: dto.notes,
          acceptedAt: dto.accepted ? new Date() : null,
          acceptedById: actor.userId,
        },
      });

      await this.audit(
        tx,
        actor.userId,
        'CLIENT_RESPONSE',
        'CaseClosure',
        closure.id,
        caseId,
        closure.stage,
        updated.stage,
      );

      return updated;
    });
  }

  async evaluate(
    actor: Actor,
    caseId: number,
    dto: EvaluateClosureDto,
  ) {
    const caso = await this.loadCase(caseId);

    if (dto.type === EvaluationType.SATISFACCION_CLIENTE) {
      await this.authorizeClient(actor, caso.companyId);
    } else {
      this.authorizeAdvisory(actor);
    }

    const closure = await this.closureOrThrow(caseId);
    this.ensureStage(closure.stage, 'ACEPTADO');

    return this.prisma.$transaction(async (tx) => {
      const evaluation = await tx.evaluation.upsert({
        where: {
          caseId_type_evaluatorId: {
            caseId,
            type: dto.type,
            evaluatorId: actor.userId,
          },
        },
        create: {
          caseId,
          type: dto.type,
          score: dto.score,
          comments: dto.comments,
          evaluatorId: actor.userId,
        },
        update: {
          score: dto.score,
          comments: dto.comments,
        },
      });

      await this.audit(
        tx,
        actor.userId,
        'EVALUATE',
        'Evaluation',
        evaluation.id,
        caseId,
        closure.stage,
        closure.stage,
      );

      return evaluation;
    });
  }

  async close(actor: Actor, caseId: number) {
    const caso = await this.loadCase(caseId);
    this.authorizeConsultant(actor, caso);

    const closure = await this.closureOrThrow(caseId);
    this.ensureStage(closure.stage, 'ACEPTADO');

    if (!closure.acceptedAt) {
      throw new UnprocessableEntityException(
        'Falta la aceptación final del cliente',
      );
    }

    await this.ensureFinalDeliverables(caseId);

    const evaluations = await this.prisma.evaluation.findMany({
      where: { caseId },
      select: { type: true },
    });
    const types = new Set(evaluations.map((item) => item.type));

    const missing = [
      EvaluationType.SATISFACCION_CLIENTE,
      EvaluationType.DESEMPENO_CONSULTOR,
    ].filter((type) => !types.has(type));

    if (missing.length) {
      throw new UnprocessableEntityException({
        message: 'Faltan evaluaciones de cierre',
        missing,
      });
    }

    if (caso.status !== 'LISTO_PARA_CIERRE') {
      throw new UnprocessableEntityException(
        'El caso no está listo para cierre',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.caseClosure.update({
        where: { caseId },
        data: { stage: 'CERRADO' },
      });

      await this.workflow.transition(
        caseId,
        'CERRADO',
        actor.userId,
        'Cierre con aceptación y evaluaciones completas',
        tx,
      );

      await this.audit(
        tx,
        actor.userId,
        'CLOSE',
        'CaseClosure',
        closure.id,
        caseId,
        closure.stage,
        updated.stage,
      );

      return updated;
    });
  }

  private async loadCase(caseId: number) {
    const caso = await this.prisma.case.findUnique({
      where: { id: caseId },
      select: {
        id: true,
        companyId: true,
        status: true,
        assignedConsultant: { select: { userId: true } },
      },
    });

    if (!caso) throw new NotFoundException('Caso no existe');
    return caso;
  }

  private async authorizeRead(
    actor: Actor,
    caso: {
      companyId: number;
      assignedConsultant: { userId: number } | null;
    },
  ) {
    if (actor.role === 'ADMIN' || actor.role === 'ADVISORY') return;

    if (
      actor.role === 'CONSULTOR' &&
      caso.assignedConsultant?.userId === actor.userId
    ) {
      return;
    }

    if (actor.role === 'MIPYME') {
      await this.authorizeClient(actor, caso.companyId);
      return;
    }

    throw new ForbiddenException('No tienes acceso al caso');
  }

  private authorizeConsultant(
    actor: Actor,
    caso: { assignedConsultant: { userId: number } | null },
  ) {
    if (
      actor.role !== 'CONSULTOR' ||
      caso.assignedConsultant?.userId !== actor.userId
    ) {
      throw new ForbiddenException(
        'Solo el consultor asignado puede ejecutar esta acción',
      );
    }
  }

  private authorizeAdvisory(actor: Actor) {
    if (actor.role !== 'ADMIN' && actor.role !== 'ADVISORY') {
      throw new ForbiddenException(
        'Solo Advisory o Admin pueden ejecutar esta acción',
      );
    }
  }

  private async authorizeClient(actor: Actor, companyId: number) {
    if (actor.role !== 'MIPYME') {
      throw new ForbiddenException(
        'Solo el cliente puede ejecutar esta acción',
      );
    }

    const contact = await this.prisma.companyContact.findFirst({
      where: { userId: actor.userId, companyId },
      select: { id: true },
    });

    if (!contact) {
      throw new ForbiddenException('No tienes acceso al caso');
    }
  }

  private async closureOrThrow(caseId: number) {
    const closure = await this.prisma.caseClosure.findUnique({
      where: { caseId },
    });

    if (!closure) {
      throw new NotFoundException('El cierre técnico no existe');
    }

    return closure;
  }

  private ensureStage(current: string, expected: string) {
    if (current !== expected) {
      throw new UnprocessableEntityException(
        `Etapa inválida: se esperaba ${expected}, actual ${current}`,
      );
    }
  }

  private async ensureFinalDeliverables(caseId: number) {
    const count = await this.prisma.deliverable.count({
      where: {
        caseId,
        status: { in: ['CARGADO', 'APROBADO'] },
      },
    });

    if (count === 0) {
      throw new UnprocessableEntityException(
        'El caso no tiene entregables finales',
      );
    }
  }

  private async audit(
    tx: Prisma.TransactionClient,
    actorId: number,
    action: string,
    entity: string,
    entityId: number,
    caseId: number,
    prevState: string | null,
    newState: string | null,
  ) {
    await tx.auditLog.create({
      data: {
        actorId,
        action,
        entity,
        entityId,
        caseId,
        prevState,
        newState,
      },
    });
  }
}