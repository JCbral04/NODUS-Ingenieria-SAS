import { EvaluationType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class EvaluateClosureDto {
  @IsEnum(EvaluationType)
  type: EvaluationType;

  @IsInt()
  @Min(1)
  @Max(5)
  score: number;

  @IsOptional()
  @IsString()
  comments?: string;
}