import { IsNotEmpty, IsString } from 'class-validator';

export class AskChatbotDto {
  @IsNotEmpty()
  @IsString()
  question: string;
}
