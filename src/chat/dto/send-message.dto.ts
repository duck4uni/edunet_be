import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  receiverId: string;

  @IsString()
  @MaxLength(5000)
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  type?: string;
}