import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScheduleType } from '../entities/schedule.entity';

/**
 * Tạo nhiều buổi học cùng lúc theo lịch tái diễn.
 * Ví dụ: mỗi Thứ Hai & Thứ Tư, từ 2026-04-07 đến 2026-06-30, 08:00-10:00.
 */
export class CreateRecurringScheduleDto {
  @ApiProperty({ example: 'Buổi học Lập trình Web' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ScheduleType })
  @IsOptional()
  @IsEnum(ScheduleType)
  type?: ScheduleType;

  @ApiProperty({ example: '2026-04-07', description: 'Ngày bắt đầu (cũng là ngày diễn ra đầu tiên nếu trùng weekDays)' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-06-30', description: 'Ngày kết thúc tái diễn (inclusive)' })
  @IsNotEmpty()
  @IsDateString()
  recurrenceEndDate: string;

  @ApiProperty({
    example: [1, 3],
    description: 'Các ngày trong tuần (0=CN, 1=T2, 2=T3, 3=T4, 4=T5, 5=T6, 6=T7)',
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weekDays: number[];

  @ApiProperty({ example: '08:00' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'startTime must be in HH:mm or HH:mm:ss format' })
  startTime: string;

  @ApiProperty({ example: '10:00' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'endTime must be in HH:mm or HH:mm:ss format' })
  endTime: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meetingLink?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional({ description: 'Admin only: assign to specific teacher UUID' })
  @IsOptional()
  @IsUUID()
  teacherId?: string;
}
