import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CancelScheduleDto {
  @ApiPropertyOptional({ description: 'Lý do hủy buổi học' })
  @IsOptional()
  @IsString()
  cancelReason?: string;
}
