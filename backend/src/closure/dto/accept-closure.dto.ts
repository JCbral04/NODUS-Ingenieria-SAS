import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class AcceptClosureDto {
  @IsBoolean()
  accepted: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}