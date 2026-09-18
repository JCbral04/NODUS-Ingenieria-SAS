import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateProposalDto {
  @IsString() executiveSummary: string;
  @IsString() objective: string;
  @IsString() scope: string;
  @IsOptional() @IsString() exclusions?: string;
  @IsOptional() @IsObject() activities?: Record<string, unknown>;
  @IsOptional() @IsObject() deliverables?: Record<string, unknown>;
  @IsOptional() @IsObject() schedule?: Record<string, unknown>;
  @IsOptional() @IsString() valuation?: string;
  @IsOptional() @IsString() conditions?: string;
}
