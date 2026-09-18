import { IsIn, IsOptional, IsString } from 'class-validator';
import { CaseStatus } from '@prisma/client';

export class TransitionDto {
  @IsIn(Object.values(CaseStatus) as string[])
  targetStatus: CaseStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
