import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterTeacherDto {
  // --- User fields ---
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;

  // --- Teacher profile fields ---
  @IsOptional()
  @IsString()
  qualification?: string;

  @IsOptional()
  @IsArray()
  specialization?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  experience?: number;

  @IsOptional()
  @IsString()
  bio?: string;
}
