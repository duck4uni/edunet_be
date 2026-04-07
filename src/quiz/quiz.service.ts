import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from './entities/quiz.entity';
import { QuizAttempt, AttemptStatus } from './entities/quiz-attempt.entity';
import { Pagination } from 'src/core/decorators/pagination-params.decorator';
import { Sorting } from 'src/core/decorators/sorting-params.decorator';
import { Filtering } from 'src/core/decorators/filtering-params.decorator';
import { Including } from 'src/core/decorators/including-params.decorator';
import { getOrder, getWhere, getRelations } from 'src/core/helpers';
import { ErrorResponse, SuccessResponse } from 'src/core/responses/base.responses';
import { CommonResponse, PaginationResponseInterface } from 'src/core/types/response';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(QuizAttempt)
    private readonly quizAttemptRepository: Repository<QuizAttempt>,
  ) {}

  async create(createQuizDto: CreateQuizDto): Promise<CommonResponse<Quiz>> {
    const quiz = this.quizRepository.create(createQuizDto);
    const savedQuiz = await this.quizRepository.save(quiz);
    return new SuccessResponse(savedQuiz, HttpStatus.CREATED);
  }

  async findAll(
    pagination: Pagination,
    sorts: Sorting[] | null,
    filters: Filtering[] | null,
    includes: Including | null,
  ): Promise<CommonResponse<PaginationResponseInterface<Quiz>>> {
    const where = filters ? getWhere(filters) : {};
    const order = sorts ? getOrder(sorts) : { createdAt: 'DESC' };
    const relations = includes ? getRelations(includes) : [];

    const [rows, count] = await this.quizRepository.findAndCount({
      where,
      order,
      relations,
      skip: pagination.offset,
      take: pagination.limit,
    });

    return new SuccessResponse({ rows, count });
  }

  async findOne(id: string): Promise<CommonResponse<Quiz>> {
    const quiz = await this.quizRepository.findOne({
      where: { id },
      relations: ['course'],
    });

    if (!quiz) {
      return new ErrorResponse('Quiz not found', HttpStatus.NOT_FOUND);
    }

    return new SuccessResponse(quiz);
  }

  async findByCourse(courseId: string, visibleOnly = false): Promise<CommonResponse<Quiz[]>> {
    const where: any = { courseId };
    if (visibleOnly) {
      where.isVisible = true;
    }
    const quizzes = await this.quizRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return new SuccessResponse(quizzes);
  }

  async update(id: string, updateQuizDto: UpdateQuizDto): Promise<CommonResponse<Quiz>> {
    const quiz = await this.quizRepository.findOne({ where: { id } });

    if (!quiz) {
      return new ErrorResponse('Quiz not found', HttpStatus.NOT_FOUND);
    }

    Object.assign(quiz, updateQuizDto);
    const updatedQuiz = await this.quizRepository.save(quiz);

    return new SuccessResponse(updatedQuiz);
  }

  async remove(id: string): Promise<CommonResponse> {
    const quiz = await this.quizRepository.findOne({ where: { id } });

    if (!quiz) {
      return new ErrorResponse('Quiz not found', HttpStatus.NOT_FOUND);
    }

    await this.quizRepository.softDelete(id);
    return new SuccessResponse({ message: 'Quiz deleted successfully' });
  }

  // Quiz Attempt methods
  async startAttempt(quizId: string, studentId: string): Promise<CommonResponse<QuizAttempt>> {
    const quiz = await this.quizRepository.findOne({ where: { id: quizId } });

    if (!quiz) {
      return new ErrorResponse('Quiz not found', HttpStatus.NOT_FOUND);
    }

    // Check max attempts
    const attemptCount = await this.quizAttemptRepository.count({
      where: { quizId, studentId },
    });

    if (attemptCount >= quiz.maxAttempts) {
      return new ErrorResponse('Maximum attempts reached', HttpStatus.BAD_REQUEST);
    }

    const attempt = this.quizAttemptRepository.create({
      quizId,
      studentId,
      startedAt: new Date(),
      status: AttemptStatus.IN_PROGRESS,
    });

    const savedAttempt = await this.quizAttemptRepository.save(attempt);
    return new SuccessResponse(savedAttempt, HttpStatus.CREATED);
  }

  async submitAttempt(
    attemptId: string,
    answers: object,
    score: number,
    correctAnswers: number,
  ): Promise<CommonResponse<QuizAttempt>> {
    const attempt = await this.quizAttemptRepository.findOne({ where: { id: attemptId } });

    if (!attempt) {
      return new ErrorResponse('Attempt not found', HttpStatus.NOT_FOUND);
    }

    attempt.answers = answers;
    attempt.score = score;
    attempt.correctAnswers = correctAnswers;
    attempt.totalAnswered = Object.keys(answers).length;
    attempt.completedAt = new Date();
    attempt.timeSpent = Math.floor((new Date().getTime() - attempt.startedAt.getTime()) / 1000);
    attempt.status = AttemptStatus.COMPLETED;

    const updatedAttempt = await this.quizAttemptRepository.save(attempt);
    return new SuccessResponse(updatedAttempt);
  }

  async findAttemptById(attemptId: string): Promise<CommonResponse<QuizAttempt>> {
    const attempt = await this.quizAttemptRepository.findOne({
      where: { id: attemptId },
      relations: ['quiz'],
    });

    if (!attempt) {
      return new ErrorResponse('Attempt not found', HttpStatus.NOT_FOUND);
    }

    return new SuccessResponse(attempt);
  }

  async getStudentAttempts(quizId: string, studentId: string): Promise<CommonResponse<QuizAttempt[]>> {
    const attempts = await this.quizAttemptRepository.find({
      where: { quizId, studentId },
      order: { createdAt: 'DESC' },
    });

    return new SuccessResponse(attempts);
  }

  async getBestScore(quizId: string, studentId: string): Promise<CommonResponse<{ bestScore: number }>> {
    const result = await this.quizAttemptRepository
      .createQueryBuilder('attempt')
      .select('MAX(attempt.score)', 'bestScore')
      .where('attempt.quizId = :quizId', { quizId })
      .andWhere('attempt.studentId = :studentId', { studentId })
      .andWhere('attempt.status = :status', { status: AttemptStatus.COMPLETED })
      .getRawOne();

    return new SuccessResponse({ bestScore: result?.bestScore || 0 });
  }

  async getMyProgress(courseId: string, studentId: string): Promise<CommonResponse<Record<string, { attempts: number; bestScore: number; status: string }>>> {
    // Get all quizzes for this course
    const quizzes = await this.quizRepository.find({ where: { courseId } });
    const quizIds = quizzes.map(q => q.id);

    if (quizIds.length === 0) {
      return new SuccessResponse({});
    }

    // Get all attempts for this student across all quizzes in the course
    const attempts = await this.quizAttemptRepository
      .createQueryBuilder('attempt')
      .where('attempt.quizId IN (:...quizIds)', { quizIds })
      .andWhere('attempt.studentId = :studentId', { studentId })
      .getMany();

    // Build progress map
    const progressMap: Record<string, { attempts: number; bestScore: number; status: string }> = {};
    for (const quiz of quizzes) {
      const quizAttempts = attempts.filter(a => a.quizId === quiz.id);
      const completedAttempts = quizAttempts.filter(a => a.status === AttemptStatus.COMPLETED);
      const inProgressAttempts = quizAttempts.filter(a => a.status === AttemptStatus.IN_PROGRESS);
      const bestScore = completedAttempts.length > 0
        ? Math.max(...completedAttempts.map(a => Number(a.score) || 0))
        : 0;

      let status = 'not-started';
      if (completedAttempts.length > 0) {
        status = 'completed';
      } else if (inProgressAttempts.length > 0) {
        status = 'in-progress';
      }

      progressMap[quiz.id] = {
        attempts: quizAttempts.length,
        bestScore,
        status,
      };
    }

    return new SuccessResponse(progressMap);
  }
}
