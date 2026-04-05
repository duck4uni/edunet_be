import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsUUID, IsArray } from 'class-validator';

export class CreateQuizDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsArray()
  questions?: any[];

  @IsOptional()
  @IsNumber()
  totalQuestions?: number;

  @IsOptional()
  @IsNumber()
  maxAttempts?: number;

  @IsOptional()
  @IsNumber()
  passingScore?: number;

  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean;

  @IsOptional()
  @IsBoolean()
  showCorrectAnswers?: boolean;

  @IsNotEmpty()
  @IsUUID()
  courseId: string;
}
