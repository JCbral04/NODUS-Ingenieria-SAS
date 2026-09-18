import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { WorkflowService } from '../workflow/workflow.service';

@Injectable()
export class ContractsService {
  constructor(
    private prisma: PrismaService,
    private workflow: WorkflowService,
  ) {}

  async items(caseId: number) {
    let items = await this.prisma.contractChecklistItem.findMany({
      where: { caseId },
      orderBy: { id: 'asc' },
    });
    if (items.length === 0) {
      const templates = await this.prisma.contractChecklistItem.findMany({ where: { caseId: null } });
      if (!templates.length) return [];
      await this.prisma.contractChecklistItem.createMany({
        data: templates.map((t) => ({ caseId, label: t.label, responsible: t.responsible })),
      });
      items = await this.prisma.contractChecklistItem.findMany({ where: { caseId }, orderBy: { id: 'asc' } });
    }
    return items;
  }

  async completeItem(itemId: number, evidence?: string) {
    const item = await this.prisma.contractChecklistItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Ítem no existe');
    return this.prisma.contractChecklistItem.update({
      where: { id: itemId },
      data: { status: 'COMPLETADO', completedAt: new Date(), evidence: evidence ?? null },
    });
  }

  async authorize(caseId: number, actorId: number) {
    const caso = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!caso) throw new NotFoundException('Caso no existe');
    if (caso.status !== 'PENDIENTE_CONTRATACION')
      throw new UnprocessableEntityException(`El caso no está pendiente de contratación (estado: ${caso.status})`);

    const pending = await this.prisma.contractChecklistItem.findMany({
      where: { caseId, status: { not: 'COMPLETADO' } },
      select: { id: true, label: true, responsible: true },
    });
    if (pending.length)
      throw new UnprocessableEntityException({
        message: 'Checklist contractual incompleto — autorización bloqueada (RF-070)',
        pending,
      });

    return this.workflow.transition(caseId, 'AUTORIZADO_EJECUCION', actorId, 'Checklist T7A completo: autorizado para ejecución');
  }
}