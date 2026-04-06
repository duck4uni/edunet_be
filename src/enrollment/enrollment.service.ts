import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment, EnrollmentStatus } from './entities/enrollment.entity';
import { Pagination } from 'src/core/decorators/pagination-params.decorator';
import { Sorting } from 'src/core/decorators/sorting-params.decorator';
import { Filtering } from 'src/core/decorators/filtering-params.decorator';
import { Including } from 'src/core/decorators/including-params.decorator';
import { getOrder, getWhere, getRelations } from 'src/core/helpers';
import { ErrorResponse, SuccessResponse } from 'src/core/responses/base.responses';
import { CommonResponse, PaginationResponseInterface } from 'src/core/types/response';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';

@Injectable()
export class EnrollmentService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
  ) {}

  async create(createEnrollmentDto: CreateEnrollmentDto): Promise<CommonResponse<Enrollment>> {
    // Check if enrollment already exists
    const existingEnrollment = await this.enrollmentRepository.findOne({
      where: {
        userId: createEnrollmentDto.userId,
        courseId: createEnrollmentDto.courseId,
      },
    });

    if (existingEnrollment) {
      return new ErrorResponse('User already enrolled in this course', HttpStatus.BAD_REQUEST);
    }

    const enrollment = this.enrollmentRepository.create(createEnrollmentDto);
    const savedEnrollment = await this.enrollmentRepository.save(enrollment);
    return new SuccessResponse(savedEnrollment, HttpStatus.CREATED);
  }

  async findAll(
    pagination: Pagination,
    sorts: Sorting[] | null,
    filters: Filtering[] | null,
    includes: Including | null,
  ): Promise<CommonResponse<PaginationResponseInterface<Enrollment>>> {
    const where = filters ? getWhere(filters) : {};
    const order = sorts ? getOrder(sorts) : { createdAt: 'DESC' };
    const relations = includes ? getRelations(includes) : [];

    const [rows, count] = await this.enrollmentRepository.findAndCount({
      where,
      order,
      relations,
      skip: pagination.offset,
      take: pagination.limit,
    });

    return new SuccessResponse({ rows, count });
  }

  async findOne(id: string): Promise<CommonResponse<Enrollment>> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id },
      relations: ['user', 'course'],
    });

    if (!enrollment) {
      return new ErrorResponse('Enrollment not found', HttpStatus.NOT_FOUND);
    }

    return new SuccessResponse(enrollment);
  }

  async findByUser(userId: string): Promise<CommonResponse<Enrollment[]>> {
    const enrollments = await this.enrollmentRepository.find({
      where: { userId },
      relations: ['course'],
    });

    return new SuccessResponse(enrollments);
  }

  async findByCourse(courseId: string): Promise<CommonResponse<Enrollment[]>> {
    const enrollments = await this.enrollmentRepository.find({
      where: { courseId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    return new SuccessResponse(enrollments);
  }

  async findMyEnrollments(userId: string): Promise<CommonResponse<Enrollment[]>> {
    const enrollments = await this.enrollmentRepository.find({
      where: { userId },
      relations: ['course', 'course.category', 'course.teacher', 'course.lessons'],
      order: { lastAccessedAt: { direction: 'DESC', nulls: 'LAST' }, createdAt: 'DESC' },
    });

    return new SuccessResponse(enrollments);
  }

  async checkEnrollment(userId: string, courseId: string): Promise<CommonResponse<{ enrolled: boolean; isPending: boolean; enrollment: Enrollment | null }>> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { userId, courseId },
    });

    return new SuccessResponse({
      enrolled: enrollment
        ? enrollment.status === EnrollmentStatus.ACTIVE || enrollment.status === EnrollmentStatus.COMPLETED
        : false,
      isPending: enrollment ? enrollment.status === EnrollmentStatus.PENDING : false,
      enrollment,
    });
  }

  async updateProgress(id: string, userId: string, progress: number): Promise<CommonResponse<Enrollment>> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id, userId },
    });

    if (!enrollment) {
      return new ErrorResponse('Enrollment not found', HttpStatus.NOT_FOUND);
    }

    enrollment.progress = progress;
    enrollment.lastAccessedAt = new Date();
    if (progress >= 100) {
      enrollment.status = EnrollmentStatus.COMPLETED;
      enrollment.completedAt = new Date();
    }

    const updated = await this.enrollmentRepository.save(enrollment);
    return new SuccessResponse(updated);
  }

  async approve(id: string): Promise<CommonResponse<Enrollment>> {
    const enrollment = await this.enrollmentRepository.findOne({ where: { id } });

    if (!enrollment) {
      return new ErrorResponse('Enrollment not found', HttpStatus.NOT_FOUND);
    }

    if (enrollment.status !== EnrollmentStatus.PENDING) {
      return new ErrorResponse('Only pending enrollments can be approved', HttpStatus.BAD_REQUEST);
    }

    enrollment.status = EnrollmentStatus.ACTIVE;
    const updated = await this.enrollmentRepository.save(enrollment);
    return new SuccessResponse(updated);
  }

  async reject(id: string): Promise<CommonResponse<Enrollment>> {
    const enrollment = await this.enrollmentRepository.findOne({ where: { id } });

    if (!enrollment) {
      return new ErrorResponse('Enrollment not found', HttpStatus.NOT_FOUND);
    }

    if (enrollment.status !== EnrollmentStatus.PENDING) {
      return new ErrorResponse('Only pending enrollments can be rejected', HttpStatus.BAD_REQUEST);
    }

    enrollment.status = EnrollmentStatus.REJECTED;
    const updated = await this.enrollmentRepository.save(enrollment);
    return new SuccessResponse(updated);
  }

  async update(id: string, updateEnrollmentDto: UpdateEnrollmentDto): Promise<CommonResponse<Enrollment>> {
    const enrollment = await this.enrollmentRepository.findOne({ where: { id } });

    if (!enrollment) {
      return new ErrorResponse('Enrollment not found', HttpStatus.NOT_FOUND);
    }

    Object.assign(enrollment, updateEnrollmentDto);
    const updatedEnrollment = await this.enrollmentRepository.save(enrollment);

    return new SuccessResponse(updatedEnrollment);
  }

  async remove(id: string): Promise<CommonResponse> {
    const enrollment = await this.enrollmentRepository.findOne({ where: { id } });

    if (!enrollment) {
      return new ErrorResponse('Enrollment not found', HttpStatus.NOT_FOUND);
    }

    await this.enrollmentRepository.softDelete(id);
    return new SuccessResponse({ message: 'Enrollment deleted successfully' });
  }
}
