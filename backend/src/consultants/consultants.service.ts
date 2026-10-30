import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  ConsultantModality,
  ConsultantStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateConsultantDto } from './dto/create-consultant.dto';
import { ListConsultantsDto } from './dto/list-consultants.dto';
import { UpdateConsultantStatusDto } from './dto/update-consultant-status.dto';
import { UpdateConsultantDto } from './dto/update-consultant.dto';

const PROFILE_INCLUDE = {
  user: {
    select: {
      id: true,
      email: true,
      fullName: true,
      status: true,
    },
  },
  specialty: {
    select: {
      id: true,
      code: true,
      label: true,
    },
  },
} as const;

const TRANSITIONS: Record<ConsultantStatus, ConsultantStatus[]> = {
  REGISTRADO: ['EN_VALIDACION', 'INACTIVO'],
  EN_VALIDACION: [
    'HABILITADO',
    'CONDICIONADO',
    'SUSPENDIDO',
    'INACTIVO',
  ],
  HABILITADO: ['CONDICIONADO', 'SUSPENDIDO', 'INACTIVO'],
  CONDICIONADO: ['HABILITADO', 'SUSPENDIDO', 'INACTIVO'],
  SUSPENDIDO: ['HABILITADO', 'INACTIVO'],
  INACTIVO: [],
};

@Injectable()
export class ConsultantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(actorId: number, dto: CreateConsultantDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      include: { role: true },
    });

    if (!user) throw new NotFoundException('Usuario no existe');
    if (user.role.code !== 'CONSULTOR') {
      throw new UnprocessableEntityException(
        'El usuario debe tener rol CONSULTOR',
      );
    }

    const modality = dto.modality ?? ConsultantModality.INDEPENDIENTE;
    await this.validateSpecialty(dto.specialtyId);
    this.validateSponsor(modality, dto.sponsorName);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const consultant = await tx.consultant.create({
          data: {
            userId: dto.userId,
            specialtyId: dto.specialtyId,
            levelCode: dto.levelCode,
            modality,
            sponsorName:
              modality === ConsultantModality.SPONSOR
                ? dto.sponsorName
                : null,
            availability: dto.availability ?? true,
            bio: dto.bio,
            experienceYears: dto.experienceYears ?? 0,
          },
          include: PROFILE_INCLUDE,
        });

        await tx.auditLog.create({
          data: {
            actorId,
            action: 'CREATE',
            entity: 'Consultant',
            entityId: consultant.id,
            newState: consultant.status,
            metadata: { userId: dto.userId },
          },
        });

        return consultant;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'El usuario ya tiene un perfil de consultor',
        );
      }
      throw error;
    }
  }

  async list(dto: ListConsultantsDto) {
    return this.prisma.consultant.findMany({
      where: dto.status ? { status: dto.status } : undefined,
      include: PROFILE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async me(userId: number) {
    const consultant = await this.prisma.consultant.findUnique({
      where: { userId },
      include: PROFILE_INCLUDE,
    });

    if (!consultant) {
      throw new NotFoundException('Perfil de consultor no existe');
    }

    return consultant;
  }

  async detail(id: number) {
    const consultant = await this.prisma.consultant.findUnique({
      where: { id },
      include: PROFILE_INCLUDE,
    });

    if (!consultant) throw new NotFoundException('Consultor no existe');
    return consultant;
  }

  async update(actorId: number, id: number, dto: UpdateConsultantDto) {
    const current = await this.prisma.consultant.findUnique({
      where: { id },
    });

    if (!current) throw new NotFoundException('Consultor no existe');

    const modality = dto.modality ?? current.modality;
    const sponsorName =
      dto.sponsorName !== undefined
        ? dto.sponsorName
        : current.sponsorName;

    await this.validateSpecialty(dto.specialtyId);
    this.validateSponsor(modality, sponsorName);

    return this.prisma.$transaction(async (tx) => {
      const consultant = await tx.consultant.update({
        where: { id },
        data: {
          specialtyId: dto.specialtyId,
          levelCode: dto.levelCode,
          modality: dto.modality,
          sponsorName:
            modality === ConsultantModality.SPONSOR ? sponsorName : null,
          availability: dto.availability,
          bio: dto.bio,
          experienceYears: dto.experienceYears,
        },
        include: PROFILE_INCLUDE,
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'UPDATE',
          entity: 'Consultant',
          entityId: id,
          prevState: current.status,
          newState: consultant.status,
          metadata: { changes: Object.keys(dto) },
        },
      });

      return consultant;
    });
  }

  async updateStatus(
    actorId: number,
    id: number,
    dto: UpdateConsultantStatusDto,
  ) {
    const current = await this.prisma.consultant.findUnique({
      where: { id },
    });

    if (!current) throw new NotFoundException('Consultor no existe');

    const allowed = TRANSITIONS[current.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new UnprocessableEntityException(
        `Transición inválida: ${current.status} → ${dto.status}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const consultant = await tx.consultant.update({
        where: { id },
        data: { status: dto.status },
        include: PROFILE_INCLUDE,
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'STATUS_CHANGE',
          entity: 'Consultant',
          entityId: id,
          prevState: current.status,
          newState: dto.status,
          metadata: { note: dto.note },
        },
      });

      return consultant;
    });
  }

  async deactivate(actorId: number, id: number) {
    const current = await this.prisma.consultant.findUnique({
      where: { id },
    });

    if (!current) throw new NotFoundException('Consultor no existe');
    if (current.status === ConsultantStatus.INACTIVO) {
      throw new ConflictException('El consultor ya está inactivo');
    }

    return this.prisma.$transaction(async (tx) => {
      const consultant = await tx.consultant.update({
        where: { id },
        data: {
          status: ConsultantStatus.INACTIVO,
          availability: false,
        },
        include: PROFILE_INCLUDE,
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'DEACTIVATE',
          entity: 'Consultant',
          entityId: id,
          prevState: current.status,
          newState: ConsultantStatus.INACTIVO,
        },
      });

      return consultant;
    });
  }

  private async validateSpecialty(specialtyId?: number) {
    if (specialtyId === undefined) return;

    const specialty = await this.prisma.lovValue.findFirst({
      where: {
        id: specialtyId,
        active: true,
        category: { code: 'AREA_PROBLEMA' },
      },
      select: { id: true },
    });

    if (!specialty) {
      throw new UnprocessableEntityException(
        'La especialidad no existe o no está activa',
      );
    }
  }

  private validateSponsor(
    modality: ConsultantModality,
    sponsorName?: string | null,
  ) {
    if (
      modality === ConsultantModality.SPONSOR &&
      !sponsorName?.trim()
    ) {
      throw new BadRequestException(
        'sponsorName es obligatorio para la modalidad SPONSOR',
      );
    }
  }
}