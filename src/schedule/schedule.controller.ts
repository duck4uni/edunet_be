import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { AuthGuard } from 'src/core/guards/auth.guard';
import { PaginationParams, Pagination } from 'src/core/decorators/pagination-params.decorator';
import { SortingParams, Sorting } from 'src/core/decorators/sorting-params.decorator';
import { FilteringParams, Filtering } from 'src/core/decorators/filtering-params.decorator';
import { IncludeRelations, Including } from 'src/core/decorators/including-params.decorator';

@ApiTags('Schedules')
@Controller('schedules')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  create(@Body() createScheduleDto: CreateScheduleDto) {
    return this.scheduleService.create(createScheduleDto);
  }

  @Get()
  findAll(
    @PaginationParams() pagination: Pagination,
    @SortingParams() sorts: Sorting[] | null,
    @FilteringParams() filters: Filtering[] | null,
    @IncludeRelations() includes: Including | null,
  ) {
    return this.scheduleService.findAll(pagination, sorts, filters, includes);
  }

  @Get('upcoming')
  findUpcoming(@Query('days') days?: string) {
    return this.scheduleService.findUpcoming(days ? parseInt(days) : 7);
  }

  @Get('date-range')
  findByDateRange(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.scheduleService.findByDateRange(startDate, endDate);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scheduleService.findOne(id);
  }

  @Get('course/:courseId')
  findByCourse(@Param('courseId') courseId: string) {
    return this.scheduleService.findByCourse(courseId);
  }

  @Get('teacher/:teacherId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  findByTeacher(@Param('teacherId') teacherId: string) {
    return this.scheduleService.findByTeacher(teacherId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  update(@Param('id') id: string, @Body() updateScheduleDto: UpdateScheduleDto) {
    return this.scheduleService.update(id, updateScheduleDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  remove(@Param('id') id: string) {
    return this.scheduleService.remove(id);
  }
}
