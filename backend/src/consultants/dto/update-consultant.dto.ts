import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateConsultantDto } from './create-consultant.dto';

export class UpdateConsultantDto extends PartialType(
  OmitType(CreateConsultantDto, ['userId'] as const),
) {}