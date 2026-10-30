import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { IncidentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import {
  CreateActivityDto,
  UpdateActivityDto,
} from './dto/activity.dto';
import {
  CreateDeliverableDto,
  UpdateDeliverableDto,
} from './dto/deliverable.dto';
import {
  CreateIncidentDto,
  UpdateIncidentDto,
} from './dto/incident.dto';
import {
  CreateMilestoneDto,
  UpdateMilestoneDto,
} from './dto/milestone.dto';

type Actor = {
  userId: number;
  role: string;
};

const INCIDENT_TRANSITIONS: Record<
  IncidentStatus,
  IncidentStatus[]
> = {
  ABIERTA: ['EN_ATENCION', 'ESCALADA', 'CERRADA'],
  EN_ATENCION: ['ESCALADA', 'CERRADA'],
  ESCALADA: ['EN_ATENCION', 'CERRADA'],
  CERRADA: [],
};

@Injectable()
export class ExecutionService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(actor: Actor, caseId: number) {
    await this.authorizeCase(actor, caseId);

    const [activities, milestones, deliverables, incidents] =
      await Promise.all([
        this.prisma.activity.findMany({
          where: { caseId },
          orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
        }),
        this.prisma.milestone.findMany({
          where: { caseId },
          orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
        }),
        this.prisma.deliverable.findMany({
          where: { caseId },
          orderBy: [
            { milestoneId: 'asc' },
            { title: 'asc' },
            { version: 'desc' },
          ],
        }),
        this.prisma.incident.findMany({
          where: { caseId },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

    return { activities, milestones, deliverables, incidents };
  }

  async listActivities(actor: Actor, caseId: number) {
    await this.authorizeCase(actor, caseId);
    return this.prisma.activity.findMany({
      where: { caseId },
      orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
    });
  }

  async createActivity(
    actor: Actor,
    caseId: number,
    dto: CreateActivityDto,
  ) {
    await this.authorizeCase(actor, caseId, true);

    return this.prisma.$transaction(async (tx) => {
      const activity = await tx.activity.create({
        data: { caseId, ...dto },
      });

      await this.audit(
        tx,
        actor.userId,
        'CREATE',
        'Activity',
        activity.id,
        caseId,
        null,
        activity.status,
      );

      return activity;
    });
  }

  async updateActivity(
    actor: Actor,
    caseId: number,
    id: number,
    dto: UpdateActivityDto,
  ) {
    await this.authorizeCase(actor, caseId, true);
    const existing = await this.activityOrThrow(caseId, id);

    return this.prisma.$transaction(async (tx) => {
      const activity = await tx.activity.update({
        where: { id },
        data: dto,
      });

      await this.audit(
        tx,
        actor.userId,
        'UPDATE',
        'Activity',
        id,
        caseId,
        existing.status,
        activity.status,
      );

      return activity;
    });
  }

  async removeActivity(actor: Actor, caseId: number, id: number) {
    await this.authorizeCase(actor, caseId, true);
    const existing = await this.activityOrThrow(caseId, id);

    await this.prisma.$transaction(async (tx) => {
      await tx.activity.delete({ where: { id } });
      await this.audit(
        tx,
        actor.userId,
        'DELETE',
        'Activity',
        id,
        caseId,
        existing.status,
        null,
      );
    });

    return { id, deleted: true };
  }

  async listMilestones(actor: Actor, caseId: number) {
    await this.authorizeCase(actor, caseId);
    return this.prisma.milestone.findMany({
      where: { caseId },
      orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
    });
  }

  async createMilestone(
    actor: Actor,
    caseId: number,
    dto: CreateMilestoneDto,
  ) {
    await this.authorizeCase(actor, caseId, true);

    return this.prisma.$transaction(async (tx) => {
      const milestone = await tx.milestone.create({
        data: { caseId, ...dto },
      });

      await this.audit(
        tx,
        actor.userId,
        'CREATE',
        'Milestone',
        milestone.id,
        caseId,
        null,
        milestone.status,
      );

      return milestone;
    });
  }

  async updateMilestone(
    actor: Actor,
    caseId: number,
    id: number,
    dto: UpdateMilestoneDto,
  ) {
    await this.authorizeCase(actor, caseId, true);
    const existing = await this.milestoneOrThrow(caseId, id);

    return this.prisma.$transaction(async (tx) => {
      const milestone = await tx.milestone.update({
        where: { id },
        data: dto,
      });

      await this.audit(
        tx,
        actor.userId,
        'UPDATE',
        'Milestone',
        id,
        caseId,
        existing.status,
        milestone.status,
      );

      return milestone;
    });
  }

  async removeMilestone(actor: Actor, caseId: number, id: number) {
    await this.authorizeCase(actor, caseId, true);
    const existing = await this.milestoneOrThrow(caseId, id);

    const deliverables = await this.prisma.deliverable.count({
      where: { milestoneId: id },
    });

    if (deliverables > 0) {
      throw new UnprocessableEntityException(
        'No puedes eliminar un hito con entregables',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.milestone.delete({ where: { id } });
      await this.audit(
        tx,
        actor.userId,
        'DELETE',
        'Milestone',
        id,
        caseId,
        existing.status,
        null,
      );
    });

    return { id, deleted: true };
  }

  async listDeliverables(actor: Actor, caseId: number) {
    await this.authorizeCase(actor, caseId);
    return this.prisma.deliverable.findMany({
      where: { caseId },
      orderBy: [
        { milestoneId: 'asc' },
        { title: 'asc' },
        { version: 'desc' },
      ],
    });
  }

  async createDeliverable(
    actor: Actor,
    caseId: number,
    dto: CreateDeliverableDto,
  ) {
    await this.authorizeCase(actor, caseId, true);
    await this.milestoneOrThrow(caseId, dto.milestoneId);

    if (dto.documentId) {
      await this.documentOrThrow(caseId, dto.documentId);
    }

    const { milestoneId, ...data } = dto;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const previous = await tx.deliverable.findFirst({
          where: { milestoneId, title: dto.title },
          orderBy: { version: 'desc' },
          select: { version: true },
        });

        const deliverable = await tx.deliverable.create({
          data: {
            ...data,
            caseId,
            milestoneId,
            version: (previous?.version ?? 0) + 1,
            completedAt:
              dto.status === 'CARGADO' || dto.status === 'APROBADO'
                ? new Date()
                : null,
          },
        });

        await this.audit(
          tx,
          actor.userId,
          'CREATE',
          'Deliverable',
          deliverable.id,
          caseId,
          null,
          deliverable.status,
        );

        return deliverable;
      });
    } catch (error) {
      this.handleDeliverableUniqueError(error);
    }
  }

  async updateDeliverable(
    actor: Actor,
    caseId: number,
    id: number,
    dto: UpdateDeliverableDto,
  ) {
    await this.authorizeCase(actor, caseId, true);
    const existing = await this.deliverableOrThrow(caseId, id);

    if (dto.milestoneId) {
      await this.milestoneOrThrow(caseId, dto.milestoneId);
    }
    if (dto.documentId) {
      await this.documentOrThrow(caseId, dto.documentId);
    }

    const completedAt =
      dto.status === undefined
        ? undefined
        : dto.status === 'CARGADO' || dto.status === 'APROBADO'
          ? (existing.completedAt ?? new Date())
          : null;

    return this.prisma.$transaction(async (tx) => {
      const deliverable = await tx.deliverable.update({
        where: { id },
        data: { ...dto, completedAt },
      });

      await this.audit(
        tx,
        actor.userId,
        'UPDATE',
        'Deliverable',
        id,
        caseId,
        existing.status,
        deliverable.status,
      );

      return deliverable;
    });
  }

  async removeDeliverable(actor: Actor, caseId: number, id: number) {
    await this.authorizeCase(actor, caseId, true);
    const existing = await this.deliverableOrThrow(caseId, id);

    await this.prisma.$transaction(async (tx) => {
      await tx.deliverable.delete({ where: { id } });
      await this.audit(
        tx,
        actor.userId,
        'DELETE',
        'Deliverable',
        id,
        caseId,
        existing.status,
        null,
      );
    });

    return { id, deleted: true };
  }

  async listIncidents(actor: Actor, caseId: number) {
    await this.authorizeCase(actor, caseId);
    return this.prisma.incident.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createIncident(
    actor: Actor,
    caseId: number,
    dto: CreateIncidentDto,
  ) {
    await this.authorizeCase(actor, caseId, true);
    await this.incidentTypeOrThrow(dto.typeId);

    const data: Prisma.IncidentUncheckedCreateInput = {
      caseId,
      reportedById: actor.userId,
      ...dto,
      closedAt: dto.status === 'CERRADA' ? new Date() : null,
    };

    return this.prisma.$transaction(async (tx) => {
      const incident = await tx.incident.create({ data });

      await this.audit(
        tx,
        actor.userId,
        'CREATE',
        'Incident',
        incident.id,
        caseId,
        null,
        incident.status,
      );

      return incident;
    });
  }

  async updateIncident(
    actor: Actor,
    caseId: number,
    id: number,
    dto: UpdateIncidentDto,
  ) {
    await this.authorizeCase(actor, caseId, true);
    const existing = await this.incidentOrThrow(caseId, id);

    if (dto.typeId) {
      await this.incidentTypeOrThrow(dto.typeId);
    }

    if (dto.status && dto.status !== existing.status) {
      const allowed = INCIDENT_TRANSITIONS[existing.status];
      if (!allowed.includes(dto.status)) {
        throw new UnprocessableEntityException(
          `Transición inválida: ${existing.status} → ${dto.status}`,
        );
      }
    }

    const closedAt =
      dto.status === undefined
        ? undefined
        : dto.status === 'CERRADA'
          ? (existing.closedAt ?? new Date())
          : null;

    return this.prisma.$transaction(async (tx) => {
      const incident = await tx.incident.update({
        where: { id },
        data: { ...dto, closedAt },
      });

      await this.audit(
        tx,
        actor.userId,
        'UPDATE',
        'Incident',
        id,
        caseId,
        existing.status,
        incident.status,
      );

      return incident;
    });
  }

  async removeIncident(actor: Actor, caseId: number, id: number) {
    await this.authorizeCase(actor, caseId, true);
    const existing = await this.incidentOrThrow(caseId, id);

    await this.prisma.$transaction(async (tx) => {
      await tx.incident.delete({ where: { id } });
      await this.audit(
        tx,
        actor.userId,
        'DELETE',
        'Incident',
        id,
        caseId,
        existing.status,
        null,
      );
    });

    return { id, deleted: true };
  }

  private async authorizeCase(
    actor: Actor,
    caseId: number,
    write = false,
  ) {
    const caso = await this.prisma.case.findUnique({
      where: { id: caseId },
      select: {
        id: true,
        assignedConsultant: { select: { userId: true } },
      },
    });

    if (!caso) throw new NotFoundException('Caso no existe');

    if (
      !write &&
      (actor.role === 'ADMIN' || actor.role === 'ADVISORY')
    ) {
      return caso;
    }

    if (
      actor.role === 'CONSULTOR' &&
      caso.assignedConsultant?.userId === actor.userId
    ) {
      return caso;
    }

    throw new ForbiddenException('No tienes acceso al caso');
  }

  private async activityOrThrow(caseId: number, id: number) {
    const item = await this.prisma.activity.findFirst({
      where: { id, caseId },
    });
    if (!item) throw new NotFoundException('Actividad no existe');
    return item;
  }

  private async milestoneOrThrow(caseId: number, id: number) {
    const item = await this.prisma.milestone.findFirst({
      where: { id, caseId },
    });
    if (!item) throw new NotFoundException('Hito no existe en este caso');
    return item;
  }

  private async deliverableOrThrow(caseId: number, id: number) {
    const item = await this.prisma.deliverable.findFirst({
      where: { id, caseId },
    });
    if (!item) {
      throw new NotFoundException('Entregable no existe en este caso');
    }
    return item;
  }

  private async incidentOrThrow(caseId: number, id: number) {
    const item = await this.prisma.incident.findFirst({
      where: { id, caseId },
    });
    if (!item) {
      throw new NotFoundException('Incidencia no existe en este caso');
    }
    return item;
  }

  private async documentOrThrow(caseId: number, id: number) {
    const document = await this.prisma.document.findFirst({
      where: { id, caseId },
      select: { id: true },
    });
    if (!document) {
      throw new NotFoundException('Documento no existe en este caso');
    }
    return document;
  }

  private async incidentTypeOrThrow(id: number) {
    const type = await this.prisma.lovValue.findFirst({
      where: {
        id,
        active: true,
        category: { code: 'TIPO_INCIDENCIA' },
      },
      select: { id: true },
    });

    if (!type) {
      throw new UnprocessableEntityException(
        'Tipo de incidencia inválido',
      );
    }

    return type;
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

  private handleDeliverableUniqueError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new UnprocessableEntityException(
        'La versión ya existe o el documento ya está asociado',
      );
    }

    throw error;
  }
}