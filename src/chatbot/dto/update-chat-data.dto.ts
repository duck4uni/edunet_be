import { PartialType } from '@nestjs/mapped-types';
import { CreateChatDataDto } from './create-chat-data.dto';

export class UpdateChatDataDto extends PartialType(CreateChatDataDto) {}
