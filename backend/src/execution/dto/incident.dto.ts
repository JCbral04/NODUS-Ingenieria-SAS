import { PartialType } from '@nestjs/swagger';
import { IncidentImpact, IncidentStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateIncidentDto {
  @IsInt()
  @Min(1)
  typeId: number;

  @IsString()
  @Length(1, 5000)
  description: string;

  @IsOptional()
  @IsString()
  suggestedAction?: string;

  @IsEnum(IncidentImpact)
  impact: IncidentImpact;

  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @IsOptional()
  @IsString()
  resolution?: string;
}

export class UpdateIncidentDto extends PartialType(CreateIncidentDto) {}