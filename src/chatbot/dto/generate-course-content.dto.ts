import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export enum GenerateContentType {
  MATERIAL = 'material',
  ASSIGNMENT = 'assignment',
}

export class GenerateCourseContentDto {
  @IsEnum(GenerateContentType)
  contentType: GenerateContentType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  courseTitle: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  courseDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  requirement?: string;
}
