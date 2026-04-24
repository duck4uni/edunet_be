import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UpdateCourseStatusDto } from './dto/update-course-status.dto';
import { AuthGuard } from 'src/core/guards/auth.guard';
import { RolesGuard } from 'src/core/guards/roles.guard';
import { Roles } from 'src/core/decorators/roles.decorator';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { User, UserRole } from 'src/user/entities/user.entity';
import { PaginationParams, Pagination } from 'src/core/decorators/pagination-params.decorator';
import { SortingParams, Sorting } from 'src/core/decorators/sorting-params.decorator';
import { FilteringParams, Filtering } from 'src/core/decorators/filtering-params.decorator';
import { IncludeRelations, Including } from 'src/core/decorators/including-params.decorator';

@ApiTags('Courses')
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a course as draft (admin must assign teacher; teacher owns own course)' })
  create(@Body() createCourseDto: CreateCourseDto, @CurrentUser() currentUser: User) {
    return this.courseService.create(createCourseDto, currentUser);
  }

  @Get()
  @ApiOperation({ summary: 'List courses (students see published only; admins/teachers see all)' })
  findAll(
    @PaginationParams() pagination: Pagination,
    @SortingParams() sorts: Sorting[] | null,
    @FilteringParams() filters: Filtering[] | null,
    @IncludeRelations() includes: Including | null,
    @CurrentUser() currentUser: User | null,
  ) {
    return this.courseService.findAll(pagination, sorts, filters, includes, currentUser);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @IncludeRelations() includes: Including | null,
    @CurrentUser() currentUser: User | null,
  ) {
    return this.courseService.findOne(id, includes, currentUser);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Teacher updates own draft/rejected course; admin updates any' })
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto, @CurrentUser() currentUser: User) {
    return this.courseService.update(id, updateCourseDto, currentUser);
  }

  @Patch(':id/submit')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Teacher submits a draft/rejected course for admin review (status → pending)' })
  submitForReview(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.courseService.submitForReview(id, currentUser);
  }

  @Patch(':id/review')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Admin approves or rejects a pending course' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateCourseStatusDto) {
    return this.courseService.updateStatus(id, dto);
  }

  @Patch(':id/publish')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Teacher publishes own approved course (status → published)' })
  publish(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.courseService.publish(id, currentUser);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  remove(@Param('id') id: string) {
    return this.courseService.remove(id);
  }
}

