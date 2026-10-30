import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ReviewClosureDto {
  @IsBoolean()
  deliverablesFinal: boolean;

  @IsBoolean()
  incidentsResolved: boolean;

  @IsBoolean()
  documentationComplete: boolean;

  @IsOptional()
  @IsString()
  observations?: string;
}