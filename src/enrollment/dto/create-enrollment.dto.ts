import { IsNotEmpty, IsOptional, IsUUID, IsEnum, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EnrollmentStatus } from '../entities/enrollment.entity';

export class CreateEnrollmentDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsUUID()
  courseId: string;

  @IsOptional()
  @IsNumber()
  progress?: number;

  @IsOptional()
  @IsEnum(EnrollmentStatus)
  @ApiPropertyOptional({ enum: EnrollmentStatus })
  status?: EnrollmentStatus;
}
