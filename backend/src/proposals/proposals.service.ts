import { ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { WorkflowService } from '../workflow/workflow.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { ReviewProposalDto } from './dto/review-proposal.dto';

@Injectable()
export class ProposalsService {
  constructor(
    private prisma: PrismaService,
    private workflow: WorkflowService,
  ) {}

  async create(userId: number, caseId: number, dto: CreateProposalDto) {
    const caso = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!caso) throw new NotFoundException('Caso no existe');
    const consultant = await this.prisma.consultant.findUnique({ where: { userId } });
    if (!consultant || caso.assignedConsultantId !== consultant.id)
      throw new ForbiddenException('Solo el consultor responsable del caso crea propuestas');

    const allowed: string[] = ['ASIGNADO', 'PROPUESTA_EN_DISENO', 'AJUSTES_PROPUESTA'];
    if (!allowed.includes(caso.status))
      throw new UnprocessableEntityException(`No se puede proponer en estado ${caso.status}`);

    const last = await this.prisma.proposal.findFirst({ where: { caseId }, orderBy: { version: 'desc' } });
    const version = last ? last.version + 1 : 1;
    const proposal = await this.prisma.proposal.create({
      data: {
        caseId, consultantId: consultant.id, version, status: 'EN_DISENO',
        executiveSummary: dto.executiveSummary, objective: dto.objective, scope: dto.scope,
        exclusions: dto.exclusions ?? null,
        activities: (dto.activities ?? undefined) as Prisma.InputJsonValue,
        deliverables: (dto.deliverables ?? undefined) as Prisma.InputJsonValue,
        schedule: (dto.schedule ?? undefined) as Prisma.InputJsonValue,
        valuation: dto.valuation ?? null,
        conditions: dto.conditions ?? null,
      },
    });

    if (caso.status === 'ASIGNADO' || caso.status === 'AJUSTES_PROPUESTA')
      await this.workflow.transition(caseId, 'PROPUESTA_EN_DISENO', userId, `Propuesta v${version} en diseño`);
    return proposal;
  }

  async list(caseId: number) {
    return this.prisma.proposal.findMany({
      where: { caseId },
      include: { reviews: { orderBy: { createdAt: 'desc' } } },
      orderBy: { version: 'desc' },
    });
  }

  async review(userId: number, proposalId: number, dto: ReviewProposalDto) {
    const proposal = await this.prisma.proposal.findUnique({ where: { id: proposalId } });
    if (!proposal) throw new NotFoundException('Propuesta no existe');

    const caso = await this.prisma.case.findUnique({ where: { id: proposal.caseId } });
    if (caso.status !== 'PROPUESTA_EN_DISENO')
      throw new UnprocessableEntityException(`El caso no está en diseño de propuesta (estado: ${caso.status})`);

    const review = await this.prisma.proposalReview.create({
      data: {
        proposalId, reviewerId: userId,
        checklist: dto.checklist as Prisma.InputJsonValue,
        observations: dto.observations ?? null,
        approved: dto.approved,
        adjustmentRequest: dto.adjustmentRequest ?? null,
      },
    });
    try {
      if (dto.approved)
        await this.workflow.transition(proposal.caseId, 'PROPUESTA_LISTA_QA', userId, `QA aprobó propuesta v${proposal.version}`);
      return review;
    } catch (e) {
      await this.prisma.proposalReview.delete({ where: { id: review.id } }).catch(() => undefined);
      throw e;
    }
  }

  async send(userId: number, proposalId: number) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { reviews: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!proposal) throw new NotFoundException('Propuesta no existe');
    if (!proposal.reviews[0]?.approved)
      throw new UnprocessableEntityException('La propuesta requiere QA aprobado antes de enviarse (RF-055)');

    const caso = await this.prisma.case.findUnique({ where: { id: proposal.caseId } });
    if (caso.status !== 'PROPUESTA_LISTA_QA')
      throw new UnprocessableEntityException(`El caso no está listo para envío (estado: ${caso.status})`);

    const previousStatus = proposal.status;
    await this.prisma.proposal.update({ where: { id: proposalId }, data: { status: 'ENVIADA' } });
    try {
      return await this.workflow.transition(proposal.caseId, 'PROPUESTA_ENVIADA', userId, `Propuesta v${proposal.version} enviada al cliente`);
    } catch (e) {
      await this.prisma.proposal.update({ where: { id: proposalId }, data: { status: previousStatus } }).catch(() => undefined);
      throw e;
    }
  }
}
