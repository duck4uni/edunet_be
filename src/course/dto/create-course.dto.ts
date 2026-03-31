import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum, IsArray, IsDateString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CourseLevel, CourseStatus } from '../entities/course.entity';

export class CreateCourseDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  discountPrice?: number;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsEnum(CourseStatus)
  @ApiPropertyOptional({ enum: CourseStatus })
  status?: CourseStatus;

  @IsOptional()
  @IsEnum(CourseLevel)
  @ApiPropertyOptional({ enum: CourseLevel })
  level?: CourseLevel;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsString()
  goal?: string;

  @IsOptional()
  @IsArray()
  schedule?: string[];

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsNotEmpty()
  @IsUUID()
  teacherId: string;
}
