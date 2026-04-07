import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { ChatDataFileType } from '../entities/chat-data.entity';

export class CreateChatDataDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(ChatDataFileType)
  fileType?: ChatDataFileType | string;

  @IsOptional()
  @IsString()
  htmlContent?: string;

  @IsOptional()
  @IsNumber()
  imageCount?: number;

  @IsOptional()
  @IsString()
  date?: string;
}
