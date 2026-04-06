import { IsOptional, IsString } from 'class-validator';

export class RejectTeacherDto {
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
