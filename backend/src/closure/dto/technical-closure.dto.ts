import { IsOptional, IsString } from 'class-validator';

export class TechnicalClosureDto {
  @IsOptional()
  @IsString()
  technicalNotes?: string;
}