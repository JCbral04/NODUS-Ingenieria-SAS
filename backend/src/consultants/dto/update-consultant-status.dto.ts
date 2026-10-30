import { ConsultantStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateConsultantStatusDto {
  @IsEnum(ConsultantStatus)
  status: ConsultantStatus;

  @IsOptional()
  @IsString()
  note?: string;
}