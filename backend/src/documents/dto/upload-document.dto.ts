import { DocumentStage } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UploadDocumentDto {
  @IsEnum(DocumentStage)
  stage: DocumentStage;
}