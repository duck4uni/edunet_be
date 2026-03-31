import { PartialType } from '@nestjs/swagger';
import { CreateSupportTicketDto } from './create-support-ticket.dto';
import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TicketStatus } from '../entities/support-ticket.entity';

export class UpdateSupportTicketDto extends PartialType(CreateSupportTicketDto) {
  @IsOptional()
  @IsEnum(TicketStatus)
  @ApiPropertyOptional({ enum: TicketStatus })
  status?: TicketStatus;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}
