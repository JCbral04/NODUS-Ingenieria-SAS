import { IsIn, IsOptional, IsString } from 'class-validator';

export class DecisionDto {
  @IsIn(['ACEPTAR', 'NO_CONTINUAR'])
  type: 'ACEPTAR' | 'NO_CONTINUAR';

  @IsOptional()
  @IsString()
  notes?: string;
}
