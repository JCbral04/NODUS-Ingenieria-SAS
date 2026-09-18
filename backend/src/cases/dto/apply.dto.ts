import { IsBoolean, IsString } from 'class-validator';

export class ApplyDto {
  @IsString()
  interestStatement: string;

  @IsBoolean()
  isAvailable: boolean;

  @IsString()
  relevance: string;

  @IsString()
  relevantExperience: string;
}
