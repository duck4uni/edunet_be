import { Controller, Get, Query, UseGuards, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/core/decorators/roles.decorator';
import { AuthGuard } from 'src/core/guards/auth.guard';
import { RolesGuard } from 'src/core/guards/roles.guard';
import { BackendValidationPipe } from 'src/core/pipes/backendValidation.pipe';
import { UserRole } from 'src/user/entities/user.entity';
import { ExportReportQueryDto, ReportQueryDto } from './dto/report-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@Controller('reports')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @UsePipes(new BackendValidationPipe())
  @ApiOperation({
    summary: 'Admin dashboard analytics with time range, filters, trends, and comparison support',
  })
  getDashboard(@Query() query: ReportQueryDto) {
    return this.reportsService.getDashboard(query);
  }

  @Get('export')
  @UsePipes(new BackendValidationPipe())
  @ApiOperation({
    summary: 'Export report as CSV or JSON content',
  })
  exportReport(@Query() query: ExportReportQueryDto) {
    return this.reportsService.exportReport(query);
  }
}
