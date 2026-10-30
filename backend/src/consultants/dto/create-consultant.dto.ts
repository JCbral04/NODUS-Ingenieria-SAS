import { ConsultantModality } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateConsultantDto {
  @IsInt()
  userId: number;

  @IsOptional()
  @IsInt()
  specialtyId?: number;

  @IsOptional()
  @IsString()
  levelCode?: string;

  @IsOptional()
  @IsEnum(ConsultantModality)
  modality?: ConsultantModality;

  @IsOptional()
  @IsString()
  sponsorName?: string;

  @IsOptional()
  @IsBoolean()
  availability?: boolean;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  experienceYears?: number;
}