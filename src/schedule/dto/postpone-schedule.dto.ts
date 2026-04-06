import { IsDateString, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PostponeScheduleDto {
  @ApiProperty({ example: '2026-04-15', description: 'Ngày mới (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsDateString()
  newDate: string;

  @ApiProperty({ example: '09:00', description: 'Giờ bắt đầu mới (HH:mm)' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'newStartTime must be in HH:mm or HH:mm:ss format' })
  newStartTime: string;

  @ApiProperty({ example: '11:00', description: 'Giờ kết thúc mới (HH:mm)' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'newEndTime must be in HH:mm or HH:mm:ss format' })
  newEndTime: string;

  @ApiPropertyOptional({ description: 'Ghi chú lý do dời lịch' })
  @IsOptional()
  @IsString()
  notes?: string;
}
