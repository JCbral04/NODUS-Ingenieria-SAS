import { IsInt } from 'class-validator';

export class AssignDto {
  @IsInt()
  applicationId: number;
}
