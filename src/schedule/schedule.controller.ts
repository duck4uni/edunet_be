import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CancelScheduleDto } from './dto/cancel-schedule.dto';
import { PostponeScheduleDto } from './dto/postpone-schedule.dto';
import { CreateRecurringScheduleDto } from './dto/create-recurring-schedule.dto';
import { AuthGuard } from 'src/core/guards/auth.guard';
import { RolesGuard } from 'src/core/guards';
import { Roles } from 'src/core/decorators/roles.decorator';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { User, UserRole } from 'src/user/entities/user.entity';
import { PaginationParams, Pagination } from 'src/core/decorators/pagination-params.decorator';
import { SortingParams, Sorting } from 'src/core/decorators/sorting-params.decorator';
import { FilteringParams, Filtering } from 'src/core/decorators/filtering-params.decorator';
import { IncludeRelations, Including } from 'src/core/decorators/including-params.decorator';

@ApiTags('Schedules')
@Controller('schedules')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  // ─── READ endpoints (static routes MUST come before /:id) ─────────────────

  @Get()
  findAll(
    @PaginationParams() pagination: Pagination,
    @SortingParams() sorts: Sorting[] | null,
    @FilteringParams() filters: Filtering[] | null,
    @IncludeRelations() includes: Including | null,
  ) {
    return this.scheduleService.findAll(pagination, sorts, filters, includes);
  }

  /** Student's personalised timetable based on active enrollments */
  @Get('my')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  findMyTimetable(@CurrentUser() currentUser: User) {
    return this.scheduleService.findMyTimetable(currentUser.id);
  }

  /** Week view — group schedules by date for calendar UI */
  @Get('weekly')
  @ApiQuery({ name: 'weekStart', required: true, description: 'YYYY-MM-DD of the first day (e.g. Monday)' })
  @ApiQuery({ name: 'courseId', required: false })
  @ApiQuery({ name: 'teacherId', required: false })
  findWeekly(
    @Query('weekStart') weekStart: string,
    @Query('courseId') courseId?: string,
    @Query('teacherId') teacherId?: string,
  ) {
    return this.scheduleService.findWeekly(weekStart, courseId, teacherId);
  }

  /** Upcoming schedules within N days (default 7) */
  @Get('upcoming')
  @ApiQuery({ name: 'days', required: false, description: 'Number of days to look ahead (default 7)' })
  findUpcoming(@Query('days') days?: string) {
    return this.scheduleService.findUpcoming(days ? parseInt(days, 10) : 7);
  }

  /** Schedules between two dates */
  @Get('date-range')
  @ApiQuery({ name: 'startDate', required: true, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'endDate', required: true, description: 'YYYY-MM-DD' })
  findByDateRange(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.scheduleService.findByDateRange(startDate, endDate);
  }

  /** All schedules for a course */
  @Get('course/:courseId')
  findByCourse(@Param('courseId') courseId: string) {
    return this.scheduleService.findByCourse(courseId);
  }

  /** All schedules assigned to a teacher */
  @Get('teacher/:teacherId')
  findByTeacher(@Param('teacherId') teacherId: string) {
    return this.scheduleService.findByTeacher(teacherId);
  }

  /** Single schedule by ID — MUST be after all static single-segment routes */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scheduleService.findOne(id);
  }

  // ─── WRITE endpoints ───────────────────────────────────────────────────────

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  create(@Body() createScheduleDto: CreateScheduleDto, @CurrentUser() currentUser: User) {
    return this.scheduleService.create(createScheduleDto, currentUser);
  }

  /** Bulk-create recurring sessions (e.g. every Mon/Wed for 12 weeks) */
  @Post('recurring')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  createRecurring(@Body() dto: CreateRecurringScheduleDto, @CurrentUser() currentUser: User) {
    return this.scheduleService.createRecurring(dto, currentUser);
  }

  /** Cancel a scheduled session */
  @Patch(':id/cancel')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  cancel(@Param('id') id: string, @Body() dto: CancelScheduleDto, @CurrentUser() currentUser: User) {
    return this.scheduleService.cancel(id, dto, currentUser);
  }

  /** Postpone a session to a new date/time */
  @Patch(':id/postpone')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  postpone(@Param('id') id: string, @Body() dto: PostponeScheduleDto, @CurrentUser() currentUser: User) {
    return this.scheduleService.postpone(id, dto, currentUser);
  }

  /** Update schedule details */
  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  update(@Param('id') id: string, @Body() updateScheduleDto: UpdateScheduleDto, @CurrentUser() currentUser: User) {
    return this.scheduleService.update(id, updateScheduleDto, currentUser);
  }

  /** Hard-delete (admin only) */
  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  remove(@Param('id') id: string) {
    return this.scheduleService.remove(id);
  }
}
