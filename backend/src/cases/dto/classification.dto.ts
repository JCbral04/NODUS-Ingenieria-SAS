import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateClassificationDto {
  @IsInt() areaId: number;
  @IsInt() interventionTypeId: number;
  @IsInt() complexityId: number;
  @IsInt() impactId: number;
  @IsBoolean() isEligible: boolean;
  @IsOptional()
  @IsString()
  notes?: string;
}
