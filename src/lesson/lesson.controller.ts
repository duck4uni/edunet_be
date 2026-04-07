import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LessonService } from './lesson.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { AuthGuard } from 'src/core/guards/auth.guard';
import { PaginationParams, Pagination } from 'src/core/decorators/pagination-params.decorator';
import { SortingParams, Sorting } from 'src/core/decorators/sorting-params.decorator';
import { FilteringParams, Filtering } from 'src/core/decorators/filtering-params.decorator';
import { IncludeRelations, Including } from 'src/core/decorators/including-params.decorator';

@ApiTags('Lessons')
@Controller('lessons')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  create(@Body() createLessonDto: CreateLessonDto) {
    return this.lessonService.create(createLessonDto);
  }

  @Get()
  findAll(
    @PaginationParams() pagination: Pagination,
    @SortingParams() sorts: Sorting[] | null,
    @FilteringParams() filters: Filtering[] | null,
    @IncludeRelations() includes: Including | null,
  ) {
    return this.lessonService.findAll(pagination, sorts, filters, includes);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lessonService.findOne(id);
  }

  @Get('course/:courseId')
  findByCourse(
    @Param('courseId') courseId: string,
    @Query('visibleOnly') visibleOnly?: string,
  ) {
    return this.lessonService.findByCourse(courseId, visibleOnly === 'true');
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  update(@Param('id') id: string, @Body() updateLessonDto: UpdateLessonDto) {
    return this.lessonService.update(id, updateLessonDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  remove(@Param('id') id: string) {
    return this.lessonService.remove(id);
  }
}
