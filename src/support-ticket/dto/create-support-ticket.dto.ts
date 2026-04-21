import { IsNotEmpty, IsOptional, IsString, IsEnum, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { TicketPriority, TicketCategory } from '../entities/support-ticket.entity';

export class CreateSupportTicketDto {
  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value, obj }) => value ?? obj.description)
  message: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  @ApiPropertyOptional({ enum: TicketPriority })
  priority?: TicketPriority;

  @IsOptional()
  @IsEnum(TicketCategory)
  @ApiPropertyOptional({ enum: TicketCategory })
  category?: TicketCategory;

  @IsOptional()
  @IsObject()
  attachments?: object;
}
