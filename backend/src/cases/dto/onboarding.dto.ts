import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class OnboardingDto {
  @IsString() companyName: string;
  @IsOptional() @IsString() taxId?: string;
  @IsString() country: string;
  @IsString() city: string;
  @IsString() contactName: string;
  @IsString() position: string;
  @IsEmail() email: string;
  @IsString() phone: string;
  @IsString() @MinLength(8) password: string;
  @IsBoolean() acceptsTerms: boolean;
  @IsString() title: string;
  @IsString() description: string;
  @IsInt() areaId: number;
  @IsInt() urgencyId: number;
  @IsInt() impactId: number;
}
