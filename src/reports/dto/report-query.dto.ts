import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { CourseStatus } from 'src/course/entities/course.entity';
import { EnrollmentStatus } from 'src/enrollment/entities/enrollment.entity';
import { TicketStatus } from 'src/support-ticket/entities/support-ticket.entity';
import { UserRole } from 'src/user/entities/user.entity';

export enum ReportGroupBy {
  AUTO = 'auto',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export enum ReportExportFormat {
  CSV = 'csv',
  JSON = 'json',
}

export class ReportQueryDto {
  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    description: 'Start date (ISO 8601). Default: endDate - 29 days',
    example: '2026-01-01',
  })
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    description: 'End date (ISO 8601). Default: today',
    example: '2026-01-31',
  })
  endDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    description: 'Comparison period start date (ISO 8601)',
    example: '2025-12-01',
  })
  compareStartDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    description: 'Comparison period end date (ISO 8601)',
    example: '2025-12-31',
  })
  compareEndDate?: string;

  @IsOptional()
  @IsEnum(ReportGroupBy)
  @ApiPropertyOptional({ enum: ReportGroupBy, default: ReportGroupBy.AUTO })
  groupBy?: ReportGroupBy;

  @IsOptional()
  @IsEnum(UserRole)
  @ApiPropertyOptional({ enum: UserRole })
  userRole?: UserRole;

  @IsOptional()
  @IsEnum(CourseStatus)
  @ApiPropertyOptional({ enum: CourseStatus })
  courseStatus?: CourseStatus;

  @IsOptional()
  @IsEnum(EnrollmentStatus)
  @ApiPropertyOptional({ enum: EnrollmentStatus })
  enrollmentStatus?: EnrollmentStatus;

  @IsOptional()
  @IsEnum(TicketStatus)
  @ApiPropertyOptional({ enum: TicketStatus })
  ticketStatus?: TicketStatus;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Filter by course category UUID' })
  categoryId?: string;
}

export class ExportReportQueryDto extends ReportQueryDto {
  @IsOptional()
  @IsEnum(ReportExportFormat)
  @ApiPropertyOptional({ enum: ReportExportFormat, default: ReportExportFormat.CSV })
  format?: ReportExportFormat;
}
