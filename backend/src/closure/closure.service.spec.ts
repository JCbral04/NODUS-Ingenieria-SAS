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

import { ClosureService } from './closure.service';

describe('ClosureService', () => {
  const tx = {
    caseClosure: {
      upsert: jest.fn(),
      update: jest.fn(),
    },
    evaluation: {
      upsert: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  const prisma = {
    case: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    caseClosure: {
      findUnique: jest.fn(),
    },
    deliverable: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    evaluation: {
      findMany: jest.fn(),
    },
    companyContact: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const workflow = {
    transition: jest.fn(),
  };

  const service = new ClosureService(
    prisma as any,
    workflow as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();

    prisma.$transaction.mockImplementation(
      (callback: (transaction: unknown) => unknown) => callback(tx),
    );

    prisma.case.findUnique.mockResolvedValue({
      id: 4,
      companyId: 1,
      status: 'EN_EJECUCION',
      assignedConsultant: { userId: 7 },
    });
    prisma.caseClosure.findUnique.mockResolvedValue(null);
    prisma.deliverable.count.mockResolvedValue(1);
    prisma.companyContact.findFirst.mockResolvedValue({ id: 1 });
  });

  it('impide el cierre técnico sin entregables finales', async () => {
    prisma.deliverable.count.mockResolvedValue(0);

    await expect(
      service.technical(
        { userId: 7, role: 'CONSULTOR' },
        4,
        {},
      ),
    ).rejects.toMatchObject({ status: 422 });

    expect(workflow.transition).not.toHaveBeenCalled();
  });

  it('registra cierre técnico y avanza por WorkflowService', async () => {
    tx.caseClosure.upsert.mockResolvedValue({
      id: 1,
      caseId: 4,
      stage: 'CIERRE_TECNICO',
    });

    await service.technical(
      { userId: 7, role: 'CONSULTOR' },
      4,
      { technicalNotes: 'Ejecución terminada' },
    );

    expect(workflow.transition).toHaveBeenCalledWith(
      4,
      'LISTO_PARA_CIERRE',
      7,
      expect.any(String),
      tx,
    );
    expect(tx.auditLog.create).toHaveBeenCalled();
  });

  it('bloquea el cierre técnico a otro consultor', async () => {
    await expect(
      service.technical(
        { userId: 8, role: 'CONSULTOR' },
        4,
        {},
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('registra la aceptación del cliente', async () => {
    prisma.caseClosure.findUnique.mockResolvedValue({
      id: 1,
      caseId: 4,
      stage: 'ENTREGADO',
    });
    tx.caseClosure.update.mockResolvedValue({
      id: 1,
      caseId: 4,
      stage: 'ACEPTADO',
      acceptedAt: new Date(),
    });

    await service.accept(
      { userId: 3, role: 'MIPYME' },
      4,
      { accepted: true, notes: 'Conforme con la entrega' },
    );

    expect(tx.caseClosure.update).toHaveBeenCalledWith({
      where: { caseId: 4 },
      data: expect.objectContaining({
        stage: 'ACEPTADO',
        acceptedById: 3,
        acceptanceNotes: 'Conforme con la entrega',
      }),
    });
  });

  it('impide cerrar si falta una evaluación', async () => {
    prisma.case.findUnique.mockResolvedValue({
      id: 4,
      companyId: 1,
      status: 'LISTO_PARA_CIERRE',
      assignedConsultant: { userId: 7 },
    });
    prisma.caseClosure.findUnique.mockResolvedValue({
      id: 1,
      caseId: 4,
      stage: 'ACEPTADO',
      acceptedAt: new Date(),
    });
    prisma.evaluation.findMany.mockResolvedValue([
      { type: 'SATISFACCION_CLIENTE' },
    ]);

    await expect(
      service.close({ userId: 7, role: 'CONSULTOR' }, 4),
    ).rejects.toMatchObject({ status: 422 });

    expect(workflow.transition).not.toHaveBeenCalled();
  });

  it('cierra el caso con aceptación y ambas evaluaciones', async () => {
    prisma.case.findUnique.mockResolvedValue({
      id: 4,
      companyId: 1,
      status: 'LISTO_PARA_CIERRE',
      assignedConsultant: { userId: 7 },
    });
    prisma.caseClosure.findUnique.mockResolvedValue({
      id: 1,
      caseId: 4,
      stage: 'ACEPTADO',
      acceptedAt: new Date(),
    });
    prisma.evaluation.findMany.mockResolvedValue([
      { type: 'SATISFACCION_CLIENTE' },
      { type: 'DESEMPENO_CONSULTOR' },
    ]);
    tx.caseClosure.update.mockResolvedValue({
      id: 1,
      caseId: 4,
      stage: 'CERRADO',
    });

    await service.close({ userId: 7, role: 'CONSULTOR' }, 4);

    expect(workflow.transition).toHaveBeenCalledWith(
      4,
      'CERRADO',
      7,
      expect.any(String),
      tx,
    );
  });
});