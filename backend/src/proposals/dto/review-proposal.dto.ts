import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class ReviewProposalDto {
  @IsObject() checklist: Record<string, unknown>;
  @IsBoolean() approved: boolean;
  @IsOptional() @IsString() observations?: string;
  @IsOptional() @IsString() adjustmentRequest?: string;
}
