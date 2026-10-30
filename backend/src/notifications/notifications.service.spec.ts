jest.mock('@nestjs/common', () => {
  class HttpException extends Error {
    constructor(message: unknown, public status: number) {
      super(typeof message === 'string' ? message : JSON.stringify(message));
    }
  }

  return {
    Injectable: () => (target: unknown) => target,
    NotFoundException: class extends HttpException {
      constructor(message: unknown) {
        super(message, 404);
      }
    },
  };
});

import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  const prisma = {
    notification: {
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const service = new NotificationsService(prisma as any);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('lista solo las notificaciones del usuario y cuenta las no leídas', async () => {
    prisma.notification.findMany.mockResolvedValue([{ id: 1, userId: 2 }]);
    prisma.notification.count
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);

    const result = await service.listForUser(2);

    expect(prisma.notification.findMany).toHaveBeenCalledWith({
      where: { userId: 2 },
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 20,
    });
    expect(result.meta).toMatchObject({
      total: 1,
      unreadCount: 1,
    });
  });

  it('no permite marcar una notificación que no pertenece al usuario', async () => {
    prisma.notification.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.markAsRead(1, 99)).rejects.toMatchObject({
      status: 404,
    });
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id: 1, userId: 99 },
      data: { isRead: true },
    });
  });

  it('registra cada emisión en AuditLog', async () => {
    const tx = {
      notification: {
        create: jest.fn().mockResolvedValue({
          id: 10,
          channel: 'IN_APP',
        }),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 20 }),
      },
    };

    await service.emit(tx as any, {
      userId: 5,
      caseId: 6,
      actorId: 2,
      templateCode: 'TCOM2',
      title: 'Caso asignado',
      message: 'Mensaje de prueba',
    });

    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'NOTIFICATION_SENT',
        entity: 'Notification',
        entityId: 10,
        caseId: 6,
      }),
    });
  });

  it('emite TCOM2 al contacto y al consultor sin duplicar destinatarios', async () => {
    const emit = jest.spyOn(service, 'emit').mockResolvedValue({} as any);
    const tx = {};

    await service.notifyTransition(tx as any, {
      caseId: 6,
      caseNumber: 'CAS-000006',
      toStatus: 'ASIGNADO',
      actorId: 2,
      contactUserId: 9,
      consultantUserId: 5,
      consultantName: 'Carlos Rentería',
    });

    expect(emit).toHaveBeenCalledTimes(2);
    expect(emit).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        userId: 9,
        templateCode: 'TCOM2',
      }),
    );
    expect(emit).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        userId: 5,
        templateCode: 'TCOM2',
      }),
    );
  });
});