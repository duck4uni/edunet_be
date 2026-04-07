import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from './entities/lesson.entity';
import { Pagination } from 'src/core/decorators/pagination-params.decorator';
import { Sorting } from 'src/core/decorators/sorting-params.decorator';
import { Filtering } from 'src/core/decorators/filtering-params.decorator';
import { Including } from 'src/core/decorators/including-params.decorator';
import { getOrder, getWhere, getRelations } from 'src/core/helpers';
import { ErrorResponse, SuccessResponse } from 'src/core/responses/base.responses';
import { CommonResponse, PaginationResponseInterface } from 'src/core/types/response';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonService {
  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
  ) {}

  async create(createLessonDto: CreateLessonDto): Promise<CommonResponse<Lesson>> {
    const lesson = this.lessonRepository.create(createLessonDto);
    const savedLesson = await this.lessonRepository.save(lesson);
    return new SuccessResponse(savedLesson, HttpStatus.CREATED);
  }

  async findAll(
    pagination: Pagination,
    sorts: Sorting[] | null,
    filters: Filtering[] | null,
    includes: Including | null,
  ): Promise<CommonResponse<PaginationResponseInterface<Lesson>>> {
    const where = filters ? getWhere(filters) : {};
    const order = sorts ? getOrder(sorts) : { order: 'ASC' };
    const relations = includes ? getRelations(includes) : [];

    const [rows, count] = await this.lessonRepository.findAndCount({
      where,
      order,
      relations,
      skip: pagination.offset,
      take: pagination.limit,
    });

    return new SuccessResponse({ rows, count });
  }

  async findOne(id: string): Promise<CommonResponse<Lesson>> {
    const lesson = await this.lessonRepository.findOne({
      where: { id },
      relations: ['course'],
    });

    if (!lesson) {
      return new ErrorResponse('Lesson not found', HttpStatus.NOT_FOUND);
    }

    return new SuccessResponse(lesson);
  }

  async findByCourse(courseId: string, visibleOnly = false): Promise<CommonResponse<Lesson[]>> {
    const where: any = { courseId };
    if (visibleOnly) {
      where.isVisible = true;
    }
    const lessons = await this.lessonRepository.find({
      where,
      order: { order: 'ASC' },
    });

    return new SuccessResponse(lessons);
  }

  async update(id: string, updateLessonDto: UpdateLessonDto): Promise<CommonResponse<Lesson>> {
    const lesson = await this.lessonRepository.findOne({ where: { id } });

    if (!lesson) {
      return new ErrorResponse('Lesson not found', HttpStatus.NOT_FOUND);
    }

    Object.assign(lesson, updateLessonDto);
    const updatedLesson = await this.lessonRepository.save(lesson);

    return new SuccessResponse(updatedLesson);
  }

  async remove(id: string): Promise<CommonResponse> {
    const lesson = await this.lessonRepository.findOne({ where: { id } });

    if (!lesson) {
      return new ErrorResponse('Lesson not found', HttpStatus.NOT_FOUND);
    }

    await this.lessonRepository.softDelete(id);
    return new SuccessResponse({ message: 'Lesson deleted successfully' });
  }
}
