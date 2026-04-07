import { IsNotEmpty, IsOptional, IsString, IsEnum, IsUUID, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MaterialType } from '../entities/material.entity';

export class CreateMaterialDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(MaterialType)
  @ApiPropertyOptional({ enum: MaterialType })
  type?: MaterialType;

  @IsNotEmpty()
  @IsString()
  downloadUrl: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsNotEmpty()
  @IsUUID()
  courseId: string;
}
