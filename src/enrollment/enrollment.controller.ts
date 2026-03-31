import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { AuthGuard } from 'src/core/guards/auth.guard';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { PaginationParams, Pagination } from 'src/core/decorators/pagination-params.decorator';
import { SortingParams, Sorting } from 'src/core/decorators/sorting-params.decorator';
import { FilteringParams, Filtering } from 'src/core/decorators/filtering-params.decorator';
import { IncludeRelations, Including } from 'src/core/decorators/including-params.decorator';
import { User } from 'src/user/entities/user.entity';

@ApiTags('Enrollments')
@ApiBearerAuth('access-token')
@Controller('enrollments')
@UseGuards(AuthGuard)
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post()
  create(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentService.create(createEnrollmentDto);
  }

  /** Enroll the current user in a course (only courseId needed in body) */
  @Post('enroll')
  enroll(
    @CurrentUser() user: User,
    @Body('courseId') courseId: string,
  ) {
    return this.enrollmentService.create({ userId: user.id, courseId });
  }

  /** Get all enrollments for the currently authenticated user with course details */
  @Get('my-enrollments')
  myEnrollments(@CurrentUser() user: User) {
    return this.enrollmentService.findMyEnrollments(user.id);
  }

  /** Check if the current user is enrolled in a specific course */
  @Get('check/:courseId')
  checkEnrollment(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
  ) {
    return this.enrollmentService.checkEnrollment(user.id, courseId);
  }

  @Get()
  findAll(
    @PaginationParams() pagination: Pagination,
    @SortingParams() sorts: Sorting[] | null,
    @FilteringParams() filters: Filtering[] | null,
    @IncludeRelations() includes: Including | null,
  ) {
    return this.enrollmentService.findAll(pagination, sorts, filters, includes);
  }

  /** Get all enrollments for a specific course (with user details) - for classroom */
  @Get('course/:courseId')
  findByCourse(@Param('courseId') courseId: string) {
    return this.enrollmentService.findByCourse(courseId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enrollmentService.findOne(id);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.enrollmentService.findByUser(userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEnrollmentDto: UpdateEnrollmentDto) {
    return this.enrollmentService.update(id, updateEnrollmentDto);
  }

  @Patch(':id/progress')
  updateProgress(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('progress') progress: number,
  ) {
    return this.enrollmentService.updateProgress(id, user.id, progress);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.enrollmentService.remove(id);
  }
}
