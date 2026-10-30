jest.mock('@nestjs/common', () => {
  class HttpException extends Error {
    constructor(message: unknown, public status: number) {
      super(
        typeof message === 'string'
          ? message
          : JSON.stringify(message),
      );
    }
  }

  const make = (status: number) =>
    class extends HttpException {
      constructor(message: unknown) {
        super(message, status);
      }
    };

  return {
    Injectable: () => (target: unknown) => target,
    ForbiddenException: make(403),
    NotFoundException: make(404),
    UnprocessableEntityException: make(422),
  };
});

import { ExecutionService } from './execution.service';

describe('ExecutionService', () => {
  const tx = {
    activity: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    milestone: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    deliverable: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    incident: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  const prisma = {
    case: {
      findUnique: jest.fn(),
    },
    activity: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    milestone: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    deliverable: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    incident: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    document: {
      findFirst: jest.fn(),
    },
    lovValue: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const service = new ExecutionService(prisma as any);

  beforeEach(() => {
    jest.clearAllMocks();

    prisma.$transaction.mockImplementation(
      (callback: (transaction: unknown) => unknown) => callback(tx),
    );

    prisma.case.findUnique.mockResolvedValue({
      id: 6,
      assignedConsultant: { userId: 5 },
    });
  });

  it('crea una actividad y registra auditoría', async () => {
    tx.activity.create.mockResolvedValue({
      id: 1,
      caseId: 6,
      title: 'Visita inicial',
      status: 'NO_INICIADA',
    });

    await service.createActivity(
      { userId: 5, role: 'CONSULTOR' },
      6,
      { title: 'Visita inicial' },
    );

    expect(tx.activity.create).toHaveBeenCalledWith({
      data: {
        caseId: 6,
        title: 'Visita inicial',
      },
    });

    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: 5,
        action: 'CREATE',
        entity: 'Activity',
        entityId: 1,
        caseId: 6,
      }),
    });
  });

  it('bloquea la escritura a un consultor no asignado', async () => {
    await expect(
      service.createMilestone(
        { userId: 6, role: 'CONSULTOR' },
        6,
        {
          title: 'Hito inicial',
          dueDate: '2026-11-15T00:00:00.000Z',
        },
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('incrementa la versión del entregable por hito y título', async () => {
    prisma.milestone.findFirst.mockResolvedValue({
      id: 10,
      caseId: 6,
    });
    tx.deliverable.findFirst.mockResolvedValue({ version: 2 });
    tx.deliverable.create.mockResolvedValue({
      id: 11,
      caseId: 6,
      milestoneId: 10,
      title: 'Informe',
      version: 3,
      status: 'PENDIENTE',
    });

    await service.createDeliverable(
      { userId: 5, role: 'CONSULTOR' },
      6,
      { milestoneId: 10, title: 'Informe' },
    );

    expect(tx.deliverable.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        caseId: 6,
        milestoneId: 10,
        title: 'Informe',
        version: 3,
      }),
    });
  });

  it('registra el consultor que reporta una incidencia', async () => {
    prisma.lovValue.findFirst.mockResolvedValue({ id: 2 });
    tx.incident.create.mockResolvedValue({
      id: 9,
      caseId: 6,
      typeId: 2,
      reportedById: 5,
      status: 'ABIERTA',
    });

    await service.createIncident(
      { userId: 5, role: 'CONSULTOR' },
      6,
      {
        typeId: 2,
        description: 'Bloqueo operativo',
        impact: 'ALTO',
      },
    );

    expect(tx.incident.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        caseId: 6,
        reportedById: 5,
        typeId: 2,
      }),
    });
  });

  it('rechaza reabrir una incidencia cerrada', async () => {
    prisma.incident.findFirst.mockResolvedValue({
      id: 8,
      caseId: 6,
      status: 'CERRADA',
      closedAt: new Date(),
    });

    await expect(
      service.updateIncident(
        { userId: 5, role: 'CONSULTOR' },
        6,
        8,
        { status: 'EN_ATENCION' },
      ),
    ).rejects.toMatchObject({ status: 422 });
  });
});