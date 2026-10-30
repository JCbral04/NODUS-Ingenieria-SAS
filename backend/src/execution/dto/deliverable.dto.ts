import { PartialType } from '@nestjs/swagger';
import { DeliverableStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateDeliverableDto {
  @IsInt()
  @Min(1)
  milestoneId: number;

  @IsString()
  @Length(1, 200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(DeliverableStatus)
  status?: DeliverableStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  documentId?: number;
}

export class UpdateDeliverableDto extends PartialType(
  CreateDeliverableDto,
) {}