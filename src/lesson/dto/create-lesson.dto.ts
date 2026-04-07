import { IsNotEmpty, IsOptional, IsString, IsEnum, IsNumber, IsBoolean, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LessonType } from '../entities/lesson.entity';

export class CreateLessonDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(LessonType)
  @ApiPropertyOptional({ enum: LessonType })
  type?: LessonType;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsNotEmpty()
  @IsUUID()
  courseId: string;
}
