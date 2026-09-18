import { UnprocessableEntityException } from '@nestjs/common';
import { ContractsService } from './contracts.service';

describe('ContractsService.authorize (RF-070)', () => {
  const prisma = {
    case: { findUnique: jest.fn() },
    contractChecklistItem: { count: jest.fn(), findMany: jest.fn(), createMany: jest.fn() },
  };
  const workflow = { transition: jest.fn() };
  // Inyección manual: sin TestingModule ni dependencias extra
  const service = new ContractsService(prisma as any, workflow as any);

  beforeEach(() => jest.clearAllMocks());

  it('materializa el checklist antes de autorizar (sin bypass por no llamar GET items)', async () => {
    prisma.case.findUnique.mockResolvedValue({ id: 7, status: 'PENDIENTE_CONTRATACION' });
    prisma.contractChecklistItem.count.mockResolvedValue(0);
    prisma.contractChecklistItem.findMany
      .mockResolvedValueOnce([{ label: 'Firma', responsible: 'CONSULTOR' }])
      .mockResolvedValueOnce([{ id: 1, label: 'Firma', status: 'PENDIENTE' }]);
    prisma.contractChecklistItem.createMany.mockResolvedValue({ count: 1 });

    await expect(service.authorize(7, 2)).rejects.toThrow(UnprocessableEntityException);
    expect(prisma.contractChecklistItem.createMany).toHaveBeenCalled();
    expect(workflow.transition).not.toHaveBeenCalled();
  });

  it('autoriza solo cuando no hay ítems pendientes', async () => {
    prisma.case.findUnique.mockResolvedValue({ id: 7, status: 'PENDIENTE_CONTRATACION' });
    prisma.contractChecklistItem.count.mockResolvedValue(5);
    prisma.contractChecklistItem.findMany.mockResolvedValue([]);
    workflow.transition.mockResolvedValue({ id: 7, status: 'AUTORIZADO_EJECUCION' });

    await service.authorize(7, 2);
    expect(workflow.transition).toHaveBeenCalledWith(7, 'AUTORIZADO_EJECUCION', 2, expect.any(String));
  });
});