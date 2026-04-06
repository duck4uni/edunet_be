import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseStatus } from '../entities/course.entity';

export class UpdateCourseStatusDto {
  @ApiProperty({ enum: [CourseStatus.APPROVED, CourseStatus.REJECTED] })
  @IsEnum([CourseStatus.APPROVED, CourseStatus.REJECTED])
  status: CourseStatus.APPROVED | CourseStatus.REJECTED;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
