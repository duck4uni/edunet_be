import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment } from './entities/assignment.entity';
import { Pagination } from 'src/core/decorators/pagination-params.decorator';
import { Sorting } from 'src/core/decorators/sorting-params.decorator';
import { Filtering } from 'src/core/decorators/filtering-params.decorator';
import { Including } from 'src/core/decorators/including-params.decorator';
import { getOrder, getWhere, getRelations } from 'src/core/helpers';
import { ErrorResponse, SuccessResponse } from 'src/core/responses/base.responses';
import { CommonResponse, PaginationResponseInterface } from 'src/core/types/response';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

@Injectable()
export class AssignmentService {
  constructor(
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
  ) {}

  async create(createAssignmentDto: CreateAssignmentDto): Promise<CommonResponse<Assignment>> {
    const assignment = this.assignmentRepository.create(createAssignmentDto);
    const savedAssignment = await this.assignmentRepository.save(assignment);
    return new SuccessResponse(savedAssignment, HttpStatus.CREATED);
  }

  async findAll(
    pagination: Pagination,
    sorts: Sorting[] | null,
    filters: Filtering[] | null,
    includes: Including | null,
  ): Promise<CommonResponse<PaginationResponseInterface<Assignment>>> {
    const where = filters ? getWhere(filters) : {};
    const order = sorts ? getOrder(sorts) : { dueDate: 'ASC' };
    const relations = includes ? getRelations(includes) : [];

    const [rows, count] = await this.assignmentRepository.findAndCount({
      where,
      order,
      relations,
      skip: pagination.offset,
      take: pagination.limit,
    });

    return new SuccessResponse({ rows, count });
  }

  async findOne(id: string): Promise<CommonResponse<Assignment>> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: ['course', 'student'],
    });

    if (!assignment) {
      return new ErrorResponse('Assignment not found', HttpStatus.NOT_FOUND);
    }

    return new SuccessResponse(assignment);
  }

  async findByStudent(studentId: string): Promise<CommonResponse<Assignment[]>> {
    const assignments = await this.assignmentRepository.find({
      where: { studentId },
      relations: ['course'],
      order: { dueDate: 'ASC' },
    });

    return new SuccessResponse(assignments);
  }

  async findByCourse(courseId: string, visibleOnly = false): Promise<CommonResponse<Assignment[]>> {
    const where: any = { courseId };
    if (visibleOnly) {
      where.isVisible = true;
    }
    const assignments = await this.assignmentRepository.find({
      where,
      order: { dueDate: 'ASC' },
    });

    return new SuccessResponse(assignments);
  }

  async update(id: string, updateAssignmentDto: UpdateAssignmentDto): Promise<CommonResponse<Assignment>> {
    const assignment = await this.assignmentRepository.findOne({ where: { id } });

    if (!assignment) {
      return new ErrorResponse('Assignment not found', HttpStatus.NOT_FOUND);
    }

    Object.assign(assignment, updateAssignmentDto);
    const updatedAssignment = await this.assignmentRepository.save(assignment);

    return new SuccessResponse(updatedAssignment);
  }

  async submit(id: string, submissionUrl: string): Promise<CommonResponse<Assignment>> {
    const assignment = await this.assignmentRepository.findOne({ where: { id } });

    if (!assignment) {
      return new ErrorResponse('Assignment not found', HttpStatus.NOT_FOUND);
    }

    assignment.submissionUrl = submissionUrl;
    assignment.submittedAt = new Date();
    assignment.status = 'submitted' as any;

    const updatedAssignment = await this.assignmentRepository.save(assignment);
    return new SuccessResponse(updatedAssignment);
  }

  async grade(id: string, grade: number, feedback?: string): Promise<CommonResponse<Assignment>> {
    const assignment = await this.assignmentRepository.findOne({ where: { id } });

    if (!assignment) {
      return new ErrorResponse('Assignment not found', HttpStatus.NOT_FOUND);
    }

    assignment.grade = grade;
    assignment.feedback = feedback || assignment.feedback;
    assignment.status = 'graded' as any;

    const updatedAssignment = await this.assignmentRepository.save(assignment);
    return new SuccessResponse(updatedAssignment);
  }

  async remove(id: string): Promise<CommonResponse> {
    const assignment = await this.assignmentRepository.findOne({ where: { id } });

    if (!assignment) {
      return new ErrorResponse('Assignment not found', HttpStatus.NOT_FOUND);
    }

    await this.assignmentRepository.softDelete(id);
    return new SuccessResponse({ message: 'Assignment deleted successfully' });
  }
}
