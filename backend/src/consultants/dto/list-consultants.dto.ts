import { ConsultantStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class ListConsultantsDto {
  @IsOptional()
  @IsEnum(ConsultantStatus)
  status?: ConsultantStatus;
}