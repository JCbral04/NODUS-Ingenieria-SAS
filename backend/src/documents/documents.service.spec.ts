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
    ForbiddenException: make(403),
    NotFoundException: make(404),
  };
});

jest.mock('node:fs/promises', () => ({
  access: jest.fn(),
  mkdir: jest.fn(),
  unlink: jest.fn(),
  writeFile: jest.fn(),
}));

import { DocumentsService } from './documents.service';

describe('DocumentsService', () => {
  const tx = {
    document: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  const prisma = {
    case: {
      findUnique: jest.fn(),
    },
    companyContact: {
      findFirst: jest.fn(),
    },
    document: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const service = new DocumentsService(prisma as any);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      (callback: (transaction: unknown) => unknown) => callback(tx),
    );
  });

  it('incrementa la versión y registra la carga en AuditLog', async () => {
    prisma.case.findUnique.mockResolvedValue({
      id: 6,
      companyId: 3,
      assignedConsultant: null,
    });
    tx.document.findFirst.mockResolvedValue({ version: 2 });
    tx.document.create.mockResolvedValue({
      id: 3,
      caseId: 6,
      stage: 'INTAKE',
      name: 'nodus-test.pdf',
      version: 3,
      mimeType: 'application/pdf',
      sizeBytes: 4,
    });

    const file = {
      originalname: 'nodus-test.pdf',
      mimetype: 'application/pdf',
      size: 4,
      buffer: Buffer.from('test'),
    } as Express.Multer.File;

    await service.upload(
      { userId: 2, role: 'ADVISORY' },
      6,
      { stage: 'INTAKE' },
      file,
    );

    expect(tx.document.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        caseId: 6,
        version: 3,
        uploadedById: 2,
      }),
      select: expect.any(Object),
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'UPLOAD',
        entity: 'Document',
        entityId: 3,
        caseId: 6,
      }),
    });
  });

  it('bloquea la descarga a un consultor no asignado', async () => {
    prisma.document.findUnique.mockResolvedValue({
      id: 2,
      caseId: 6,
      path: '/ruta/permitida/documento.pdf',
      name: 'documento.pdf',
    });
    prisma.case.findUnique.mockResolvedValue({
      id: 6,
      companyId: 3,
      assignedConsultant: { userId: 5 },
    });

    await expect(
      service.prepareDownload(
        { userId: 6, role: 'CONSULTOR' },
        2,
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('devuelve 404 cuando el documento no existe', async () => {
    prisma.document.findUnique.mockResolvedValue(null);

    await expect(
      service.prepareDownload(
        { userId: 2, role: 'ADVISORY' },
        999,
      ),
    ).rejects.toMatchObject({ status: 404 });
  });
});