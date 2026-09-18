import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { CaseStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';

const TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  CREADO: ['EN_REVISION'],
  EN_REVISION: ['CLASIFICADO'],
  CLASIFICADO: ['EN_POSTULACION'],
  EN_POSTULACION: ['ASIGNADO'],
  ASIGNADO: ['PROPUESTA_EN_DISENO'],
  PROPUESTA_EN_DISENO: ['PROPUESTA_LISTA_QA'],
  PROPUESTA_LISTA_QA: ['PROPUESTA_ENVIADA'],
  PROPUESTA_ENVIADA: ['EN_DECISION_CLIENTE'],
  EN_DECISION_CLIENTE: ['AJUSTES_PROPUESTA', 'PROPUESTA_ACEPTADA', 'CERRADO_SIN_CONTRATACION'],
  AJUSTES_PROPUESTA: ['PROPUESTA_EN_DISENO', 'PROPUESTA_ENVIADA', 'EN_DECISION_CLIENTE'],
  PROPUESTA_ACEPTADA: ['PENDIENTE_CONTRATACION'],
  PENDIENTE_CONTRATACION: ['AUTORIZADO_EJECUCION'],
  AUTORIZADO_EJECUCION: ['EN_EJECUCION'],
  EN_EJECUCION: ['LISTO_PARA_CIERRE'],
  LISTO_PARA_CIERRE: ['CERRADO'],
  CERRADO: [],
  CERRADO_SIN_CONTRATACION: [],
};

@Injectable()
export class WorkflowService {
  constructor(private prisma: PrismaService) {}

  async transition(caseId: number, target: CaseStatus, actorId: number, note?: string) {
    const caso = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!caso) throw new NotFoundException('Caso no existe');

    const allowed = TRANSITIONS[caso.status] ?? [];
    if (!allowed.includes(target))
      throw new UnprocessableEntityException(`Transición inválida: ${caso.status} → ${target}`);

    await this.prisma.$transaction(async (tx) => {
      await tx.case.update({
        where: { id: caseId },
        data: { status: target, statusChangedAt: new Date() },
      });
      await tx.caseStateHistory.create({
        data: { caseId, fromStatus: caso.status, toStatus: target, actorId, note },
      });
      await tx.auditLog.create({
        data: {
          actorId, action: 'TRANSITION', entity: 'Case', entityId: caseId, caseId,
          prevState: caso.status, newState: target, metadata: { note },
        },
      });
    });

    return this.prisma.case.findUnique({ where: { id: caseId } });
  }
}
