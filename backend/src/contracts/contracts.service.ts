import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { WorkflowService } from '../workflow/workflow.service';

@Injectable()
export class ContractsService {
  constructor(
    private prisma: PrismaService,
    private workflow: WorkflowService,
  ) {}

  private async ensureItems(caseId: number) {
    const existing = await this.prisma.contractChecklistItem.count({ where: { caseId } });
    if (existing > 0) return;
    const templates = await this.prisma.contractChecklistItem.findMany({ where: { caseId: null } });
    if (!templates.length) return;
    try {
      await this.prisma.contractChecklistItem.createMany({
        data: templates.map((t) => ({ caseId, label: t.label, responsible: t.responsible })),
      });
    } catch (e) {
      // Race: otro request materializó primero (unique caseId+label) — idempotente
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) throw e;
    }
  }

  async items(caseId: number) {
    await this.ensureItems(caseId);
    return this.prisma.contractChecklistItem.findMany({ where: { caseId }, orderBy: { id: 'asc' } });
  }

  async completeItem(caseId: number, itemId: number, evidence?: string) {
    const item = await this.prisma.contractChecklistItem.findUnique({ where: { id: itemId } });
    if (!item || item.caseId !== caseId)
      throw new NotFoundException('Ítem no existe en este caso');
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

    await this.ensureItems(caseId); // ← RF-070: el checklist SIEMPRE existe antes de evaluar

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