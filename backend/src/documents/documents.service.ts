import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { DocumentStage } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { UploadDocumentDto } from './dto/upload-document.dto';

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const DOCUMENT_SELECT = {
  id: true,
  caseId: true,
  stage: true,
  name: true,
  mimeType: true,
  sizeBytes: true,
  version: true,
  uploadedById: true,
  createdAt: true,
  uploadedBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
} as const;

type Actor = {
  userId: number;
  role: string;
};

@Injectable()
export class DocumentsService {
  private readonly storageRoot = path.resolve(
    process.env.STORAGE_PATH ?? './storage',
  );

  constructor(private readonly prisma: PrismaService) {}

  async upload(
    actor: Actor,
    caseId: number,
    dto: UploadDocumentDto,
    file: Express.Multer.File,
  ) {
    await this.authorizeCase(actor, caseId);

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Tipo de archivo no permitido');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('El archivo supera el límite de 10 MB');
    }

    const name = this.sanitizeName(file.originalname);
    const directory = this.resolveStoragePath(
      'documents',
      String(caseId),
      dto.stage,
    );
    const extension = path.extname(name).toLowerCase().slice(0, 10);
    const filePath = this.resolveStoragePath(
      'documents',
      String(caseId),
      dto.stage,
      `${randomUUID()}${extension}`,
    );

    await mkdir(directory, { recursive: true });

    try {
      await writeFile(filePath, file.buffer, { flag: 'wx' });

      return await this.prisma.$transaction(async (tx) => {
        const previous = await tx.document.findFirst({
          where: {
            caseId,
            stage: dto.stage,
            name,
          },
          orderBy: { version: 'desc' },
          select: { version: true },
        });

        const document = await tx.document.create({
          data: {
            caseId,
            stage: dto.stage,
            name,
            path: filePath,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            version: (previous?.version ?? 0) + 1,
            uploadedById: actor.userId,
          },
          select: DOCUMENT_SELECT,
        });

        await tx.auditLog.create({
          data: {
            actorId: actor.userId,
            action: 'UPLOAD',
            entity: 'Document',
            entityId: document.id,
            caseId,
            newState: dto.stage,
            metadata: {
              name: document.name,
              version: document.version,
              mimeType: document.mimeType,
              sizeBytes: document.sizeBytes,
            },
          },
        });

        return document;
      });
    } catch (error) {
      await unlink(filePath).catch(() => undefined);
      throw error;
    }
  }

  async listForCase(actor: Actor, caseId: number) {
    await this.authorizeCase(actor, caseId);

    return this.prisma.document.findMany({
      where: { caseId },
      select: DOCUMENT_SELECT,
      orderBy: [
        { stage: 'asc' },
        { name: 'asc' },
        { version: 'desc' },
      ],
    });
  }

  async prepareDownload(actor: Actor, id: number) {
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!document) throw new NotFoundException('Documento no existe');

    await this.authorizeCase(actor, document.caseId);

    const storedPath = this.resolveStoragePath(document.path);

    let realPath: string;
    try {
      realPath = realpathSync(storedPath);
    } catch {
      throw new NotFoundException('Archivo físico no existe');
    }

    const filePath = this.resolveStoragePath(realPath);

    return {
      path: filePath,
      name: document.name,
      mimeType: document.mimeType,
    };
  }

  private async authorizeCase(actor: Actor, caseId: number) {
    const caso = await this.prisma.case.findUnique({
      where: { id: caseId },
      include: {
        assignedConsultant: {
          select: { userId: true },
        },
      },
    });

    if (!caso) throw new NotFoundException('Caso no existe');

    if (actor.role === 'ADMIN' || actor.role === 'ADVISORY') {
      return caso;
    }

    if (actor.role === 'MIPYME') {
      const contact = await this.prisma.companyContact.findFirst({
        where: {
          userId: actor.userId,
          companyId: caso.companyId,
        },
        select: { id: true },
      });

      if (!contact) {
        throw new ForbiddenException('No tienes acceso al caso');
      }
      return caso;
    }

    if (
      actor.role === 'CONSULTOR' &&
      caso.assignedConsultant?.userId === actor.userId
    ) {
      return caso;
    }

    throw new ForbiddenException('No tienes acceso al caso');
  }

  private resolveStoragePath(...segments: string[]) {
    const filePath = path.resolve(this.storageRoot, ...segments);
    const rootPrefix = this.storageRoot.endsWith(path.sep)
      ? this.storageRoot
      : `${this.storageRoot}${path.sep}`;

    if (!filePath.startsWith(rootPrefix)) {
      throw new ForbiddenException('Ruta de almacenamiento no permitida');
    }

    return filePath;
  }

  private sanitizeName(originalName: string) {
    const base = path.basename(originalName);
    const sanitized = base.replace(/[^a-zA-Z0-9._-]/g, '_');

    return (sanitized || 'document').slice(0, 150);
  }
}