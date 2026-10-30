import { Injectable, NotFoundException } from '@nestjs/common';
import { CaseStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

type EmitNotificationInput = {
  userId: number;
  caseId: number;
  actorId: number;
  templateCode: string;
  title: string;
  message: string;
};

type NotifyTransitionInput = {
  caseId: number;
  caseNumber: string;
  toStatus: CaseStatus;
  actorId: number;
  contactUserId?: number | null;
  consultantUserId?: number | null;
  consultantName?: string | null;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: number, page = 1, limit = 20) {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const where = { userId };

    const [data, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      data,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
        unreadCount,
      },
    };
  }

  async markAsRead(id: number, userId: number) {
    const result = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });

    if (result.count === 0) {
      throw new NotFoundException('Notificación no existe');
    }

    return { id, isRead: true };
  }

  async notifyCaseCreated(
    tx: Prisma.TransactionClient,
    input: {
      caseId: number;
      caseNumber: string;
      actorId: number;
    },
  ) {
    const recipientIds = await this.activeAdvisoryIds(tx);

    await this.emitToMany(tx, recipientIds, {
      caseId: input.caseId,
      actorId: input.actorId,
      templateCode: 'TCOM1',
      title: 'Nuevo caso recibido',
      message: `El caso ${input.caseNumber} está pendiente de revisión.`,
    });
  }

  async notifyTransition(
    tx: Prisma.TransactionClient,
    input: NotifyTransitionInput,
  ) {
    let recipientIds: Array<number | null | undefined> = [];
    let templateCode: string;
    let title: string;
    let message: string;
    let includeAdvisory = false;

    switch (input.toStatus) {
      case 'ASIGNADO':
        recipientIds = [input.contactUserId, input.consultantUserId];
        templateCode = 'TCOM2';
        title = 'Caso asignado';
        message = `El caso ${input.caseNumber} fue asignado${
          input.consultantName ? ` a ${input.consultantName}` : ''
        }.`;
        break;

      case 'PROPUESTA_ENVIADA':
        recipientIds = [input.contactUserId];
        templateCode = 'TCOM3';
        title = 'Propuesta disponible';
        message = `Hay una nueva propuesta disponible para el caso ${input.caseNumber}.`;
        break;

      case 'EN_DECISION_CLIENTE':
        recipientIds = [input.consultantUserId];
        includeAdvisory = true;
        templateCode = 'TCOM4';
        title = 'Decisión del cliente iniciada';
        message = `El cliente inició la decisión sobre el caso ${input.caseNumber}.`;
        break;

      case 'PROPUESTA_ACEPTADA':
        recipientIds = [input.consultantUserId];
        includeAdvisory = true;
        templateCode = 'TCOM5';
        title = 'Propuesta aceptada';
        message = `La propuesta del caso ${input.caseNumber} fue aceptada. Continúa la contratación.`;
        break;

      case 'CERRADO':
      case 'CERRADO_SIN_CONTRATACION':
        recipientIds = [input.contactUserId, input.consultantUserId];
        includeAdvisory = true;
        templateCode = 'TCOM6';
        title = 'Caso finalizado';
        message = `El caso ${input.caseNumber} finalizó con estado ${input.toStatus}.`;
        break;

      default:
        return;
    }

    if (includeAdvisory) {
      recipientIds.push(...(await this.activeAdvisoryIds(tx)));
    }

    await this.emitToMany(tx, recipientIds, {
      caseId: input.caseId,
      actorId: input.actorId,
      templateCode,
      title,
      message,
    });
  }

  private async activeAdvisoryIds(tx: Prisma.TransactionClient) {
    const users = await tx.user.findMany({
      where: {
        status: 'ACTIVO',
        role: { code: 'ADVISORY' },
      },
      select: { id: true },
    });

    return users.map((user) => user.id);
  }

  private async emitToMany(
    tx: Prisma.TransactionClient,
    recipientIds: Array<number | null | undefined>,
    input: Omit<EmitNotificationInput, 'userId'>,
  ) {
    const uniqueRecipientIds = [
      ...new Set(
        recipientIds.filter((id): id is number => typeof id === 'number'),
      ),
    ];

    for (const userId of uniqueRecipientIds) {
      await this.emit(tx, { ...input, userId });
    }
  }

  async emit(
    tx: Prisma.TransactionClient,
    input: EmitNotificationInput,
  ) {
    const notification = await tx.notification.create({
      data: {
        userId: input.userId,
        caseId: input.caseId,
        templateCode: input.templateCode,
        title: input.title,
        message: input.message,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: input.actorId,
        action: 'NOTIFICATION_SENT',
        entity: 'Notification',
        entityId: notification.id,
        caseId: input.caseId,
        metadata: {
          recipientId: input.userId,
          templateCode: input.templateCode,
          channel: notification.channel,
        },
      },
    });

    return notification;
  }
}