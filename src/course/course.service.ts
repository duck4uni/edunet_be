import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course, CourseStatus } from './entities/course.entity';
import { Pagination } from 'src/core/decorators/pagination-params.decorator';
import { Sorting } from 'src/core/decorators/sorting-params.decorator';
import { Filtering } from 'src/core/decorators/filtering-params.decorator';
import { Including } from 'src/core/decorators/including-params.decorator';
import { getOrder, getWhere, getRelations } from 'src/core/helpers';
import { ErrorResponse, SuccessResponse } from 'src/core/responses/base.responses';
import { CommonResponse, PaginationResponseInterface } from 'src/core/types/response';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UpdateCourseStatusDto } from './dto/update-course-status.dto';
import { User, UserRole } from 'src/user/entities/user.entity';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async create(createCourseDto: CreateCourseDto, currentUser: User): Promise<CommonResponse<Course>> {
    const isAdmin = currentUser.role === UserRole.ADMIN;

    if (isAdmin && !createCourseDto.teacherId) {
      return new ErrorResponse(
        'Admin must assign a teacher for this course',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const course = this.courseRepository.create({
      ...createCourseDto,
      // Admin can assign to a specific teacher; teachers always own the course themselves
      teacherId: isAdmin ? (createCourseDto.teacherId ?? currentUser.id) : currentUser.id,
      // Every course starts as draft, then goes through review before teacher publish.
      status: CourseStatus.DRAFT,
      publishedAt: null,
      rejectionReason: null,
    });

    const savedCourse = await this.courseRepository.save(course);
    return new SuccessResponse(savedCourse, HttpStatus.CREATED);
  }

  async findAll(
    pagination: Pagination,
    sorts: Sorting[] | null,
    filters: Filtering[] | null,
    includes: Including | null,
    currentUser?: User | null,
  ): Promise<CommonResponse<PaginationResponseInterface<Course>>> {
    let where: any = filters ? getWhere(filters) : {};

    // Non-admin users only see published/approved courses unless they have an explicit status filter
    const hasStatusFilter = filters?.some((f) => f.property === 'status');
    if (!hasStatusFilter && (!currentUser || currentUser.role === UserRole.STUDENT)) {
      where = { ...where, status: CourseStatus.PUBLISHED };
    }

    const order = sorts ? getOrder(sorts) : { createdAt: 'DESC' };
    const relations = includes ? getRelations(includes) : [];

    const [rows, count] = await this.courseRepository.findAndCount({
      where,
      order,
      relations,
      skip: pagination.offset,
      take: pagination.limit,
    });

    return new SuccessResponse({ rows, count });
  }

  async findOne(
    id: string,
    includes?: Including | null,
    currentUser?: User | null,
  ): Promise<CommonResponse<Course>> {
    const relations = includes ? getRelations(includes) : ['category', 'teacher', 'lessons', 'reviews'];

    const course = await this.courseRepository.findOne({
      where: { id },
      relations,
    });

    if (!course) {
      return new ErrorResponse('Course not found', HttpStatus.NOT_FOUND);
    }

    const isAdmin = currentUser?.role === UserRole.ADMIN;
    const isOwnerTeacher =
      currentUser?.role === UserRole.TEACHER &&
      currentUser.id === course.teacherId;

    if (course.status !== CourseStatus.PUBLISHED && !isAdmin && !isOwnerTeacher) {
      return new ErrorResponse('Course is not available', HttpStatus.NOT_FOUND);
    }

    return new SuccessResponse(course);
  }

  async update(id: string, updateCourseDto: UpdateCourseDto, currentUser: User): Promise<CommonResponse<Course>> {
    const course = await this.courseRepository.findOne({ where: { id } });

    if (!course) {
      return new ErrorResponse('Course not found', HttpStatus.NOT_FOUND);
    }

    // Teachers can only update their own courses and only when draft/pending/rejected
    if (currentUser.role === UserRole.TEACHER) {
      if (course.teacherId !== currentUser.id) {
        return new ErrorResponse('Forbidden: you do not own this course', HttpStatus.FORBIDDEN);
      }
      const editableStatuses: CourseStatus[] = [CourseStatus.DRAFT, CourseStatus.REJECTED];
      if (!editableStatuses.includes(course.status)) {
        return new ErrorResponse(
          'Course cannot be edited while it is pending or approved',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    }

    Object.assign(course, updateCourseDto);
    const updatedCourse = await this.courseRepository.save(course);

    return new SuccessResponse(updatedCourse);
  }

  async submitForReview(id: string, currentUser: User): Promise<CommonResponse<Course>> {
    const course = await this.courseRepository.findOne({ where: { id } });

    if (!course) {
      return new ErrorResponse('Course not found', HttpStatus.NOT_FOUND);
    }

    if (course.teacherId !== currentUser.id) {
      return new ErrorResponse('Forbidden: you do not own this course', HttpStatus.FORBIDDEN);
    }

    const submittableStatuses: CourseStatus[] = [CourseStatus.DRAFT, CourseStatus.REJECTED];
    if (!submittableStatuses.includes(course.status)) {
      return new ErrorResponse(
        `Cannot submit course with status "${course.status}" for review`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    course.status = CourseStatus.PENDING;
    course.rejectionReason = null;
    const saved = await this.courseRepository.save(course);
    return new SuccessResponse(saved);
  }

  async updateStatus(id: string, dto: UpdateCourseStatusDto): Promise<CommonResponse<Course>> {
    const course = await this.courseRepository.findOne({ where: { id } });

    if (!course) {
      return new ErrorResponse('Course not found', HttpStatus.NOT_FOUND);
    }

    if (course.status !== CourseStatus.PENDING) {
      return new ErrorResponse(
        `Only courses with status "pending" can be reviewed. Current status: "${course.status}"`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    course.status = dto.status;
    course.rejectionReason = dto.status === CourseStatus.REJECTED ? (dto.rejectionReason ?? null) : null;

    if (dto.status === CourseStatus.APPROVED) {
      course.publishedAt = null;
    }

    const saved = await this.courseRepository.save(course);
    return new SuccessResponse(saved);
  }

  async publish(id: string, currentUser: User): Promise<CommonResponse<Course>> {
    const course = await this.courseRepository.findOne({ where: { id } });

    if (!course) {
      return new ErrorResponse('Course not found', HttpStatus.NOT_FOUND);
    }

    if (currentUser.role !== UserRole.TEACHER) {
      return new ErrorResponse(
        'Only teachers can publish courses',
        HttpStatus.FORBIDDEN,
      );
    }

    if (course.teacherId !== currentUser.id) {
      return new ErrorResponse('Forbidden: you do not own this course', HttpStatus.FORBIDDEN);
    }

    if (course.status !== CourseStatus.APPROVED) {
      return new ErrorResponse(
        'Only approved courses can be published',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    course.status = CourseStatus.PUBLISHED;
    course.publishedAt = new Date();
    const saved = await this.courseRepository.save(course);
    return new SuccessResponse(saved);
  }

  async remove(id: string): Promise<CommonResponse> {
    const course = await this.courseRepository.findOne({ where: { id } });

    if (!course) {
      return new ErrorResponse('Course not found', HttpStatus.NOT_FOUND);
    }

    await this.courseRepository.softDelete(id);
    return new SuccessResponse({ message: 'Course deleted successfully' });
  }
}

