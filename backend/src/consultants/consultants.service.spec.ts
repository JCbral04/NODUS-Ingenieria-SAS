jest.mock('@nestjs/common', () => {
  class HttpException extends Error {
    constructor(message: unknown, public status: number) {
      super(typeof message === 'string' ? message : JSON.stringify(message));
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
    BadRequestException: make(400),
    ConflictException: make(409),
    NotFoundException: make(404),
    UnprocessableEntityException: make(422),
  };
});

import { ConsultantsService } from './consultants.service';

describe('ConsultantsService', () => {
  const tx = {
    consultant: {
      create: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
    consultant: {
      findUnique: jest.fn(),
    },
    lovValue: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const service = new ConsultantsService(prisma as any);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      (callback: (transaction: unknown) => unknown) => callback(tx),
    );
  });

  it('crea un perfil para un usuario con rol CONSULTOR y registra auditoría', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 5,
      role: { code: 'CONSULTOR' },
    });
    tx.consultant.create.mockResolvedValue({
      id: 4,
      status: 'REGISTRADO',
    });

    await service.create(2, { userId: 5 });

    expect(tx.consultant.create).toHaveBeenCalled();
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: 2,
        action: 'CREATE',
        entity: 'Consultant',
        entityId: 4,
      }),
    });
  });

  it('rechaza crear un perfil para otro rol', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 8,
      role: { code: 'MIPYME' },
    });

    await expect(service.create(2, { userId: 8 })).rejects.toMatchObject({
      status: 422,
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('exige sponsorName cuando la modalidad es SPONSOR', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 5,
      role: { code: 'CONSULTOR' },
    });

    await expect(
      service.create(2, {
        userId: 5,
        modality: 'SPONSOR',
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rechaza una transición de estado inválida', async () => {
    prisma.consultant.findUnique.mockResolvedValue({
      id: 1,
      status: 'HABILITADO',
    });

    await expect(
      service.updateStatus(2, 1, { status: 'EN_VALIDACION' }),
    ).rejects.toMatchObject({ status: 422 });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('aplica una transición válida y registra el estado anterior y nuevo', async () => {
    prisma.consultant.findUnique.mockResolvedValue({
      id: 1,
      status: 'HABILITADO',
    });
    tx.consultant.update.mockResolvedValue({
      id: 1,
      status: 'CONDICIONADO',
    });

    await service.updateStatus(2, 1, {
      status: 'CONDICIONADO',
      note: 'Revisión documental',
    });

    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'STATUS_CHANGE',
        prevState: 'HABILITADO',
        newState: 'CONDICIONADO',
      }),
    });
  });

  it('desactiva sin eliminar el perfil ni su historial', async () => {
    prisma.consultant.findUnique.mockResolvedValue({
      id: 1,
      status: 'HABILITADO',
    });
    tx.consultant.update.mockResolvedValue({
      id: 1,
      status: 'INACTIVO',
      availability: false,
    });

    await service.deactivate(2, 1);

    expect(tx.consultant.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        status: 'INACTIVO',
        availability: false,
      },
      include: expect.any(Object),
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'DEACTIVATE',
        newState: 'INACTIVO',
      }),
    });
  });
});