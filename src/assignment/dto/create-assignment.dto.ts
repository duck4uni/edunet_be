import { IsNotEmpty, IsOptional, IsString, IsEnum, IsUUID, IsDateString, IsNumber, IsObject, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentStatus } from '../entities/assignment.entity';

export class CreateAssignmentDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsEnum(AssignmentStatus)
  @ApiPropertyOptional({ enum: AssignmentStatus })
  status?: AssignmentStatus;

  @IsOptional()
  @IsNumber()
  grade?: number;

  @IsOptional()
  @IsNumber()
  maxGrade?: number;

  @IsOptional()
  @IsObject()
  attachments?: object;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsString()
  submissionUrl?: string;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsNotEmpty()
  @IsUUID()
  courseId: string;

  @IsOptional()
  @IsUUID()
  studentId?: string;
}
