import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Quiz } from './entities/quiz.entity';
import { QuizAttempt, AttemptStatus } from './entities/quiz-attempt.entity';
import { Course } from 'src/course/entities/course.entity';
import { Pagination } from 'src/core/decorators/pagination-params.decorator';
import { Sorting } from 'src/core/decorators/sorting-params.decorator';
import { Filtering } from 'src/core/decorators/filtering-params.decorator';
import { Including } from 'src/core/decorators/including-params.decorator';
import { getOrder, getWhere, getRelations } from 'src/core/helpers';
import { ErrorResponse, SuccessResponse } from 'src/core/responses/base.responses';
import { CommonResponse, PaginationResponseInterface } from 'src/core/types/response';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { GenerateAiQuizDto } from './dto/generate-ai-quiz.dto';
import { User, UserRole } from 'src/user/entities/user.entity';

interface QuizOptionPayload {
  key: string;
  label: string;
}

interface QuizQuestionPayload {
  id: string;
  text: string;
  options: QuizOptionPayload[];
  correctAnswer: string;
}

export interface TeacherQuizAttemptItem {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentAvatar: string | null;
  status: AttemptStatus;
  score: number;
  correctAnswers: number;
  totalAnswered: number;
  startedAt: Date;
  completedAt: Date | null;
  timeSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeacherQuizAttemptsResponse {
  quiz: {
    id: string;
    title: string;
    totalQuestions: number;
    maxAttempts: number;
    passingScore: number;
  };
  summary: {
    totalAttempts: number;
    completedAttempts: number;
    inProgressAttempts: number;
    timedOutAttempts: number;
    totalStudents: number;
    averageScore: number;
    highestScore: number;
    passRate: number;
  };
  attempts: TeacherQuizAttemptItem[];
}

@Injectable()
export class QuizService {
  private geminiModel: any;

  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(QuizAttempt)
    private readonly quizAttemptRepository: Repository<QuizAttempt>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {
    this.initializeGemini();
  }

  private initializeGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    this.geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  private getOptionKey(index: number): string {
    return String.fromCharCode(65 + index);
  }

  private resolveCorrectAnswer(
    question: Record<string, unknown>,
    options: QuizOptionPayload[],
  ): string {
    const rawCorrect = question.correctAnswer;

    if (typeof rawCorrect === 'string') {
      const trimmed = rawCorrect.trim();
      const upper = trimmed.toUpperCase();

      if (options.some((option) => option.key === upper)) {
        return upper;
      }

      const parsedIndex = Number(trimmed);
      if (!Number.isNaN(parsedIndex) && Number.isInteger(parsedIndex) && options[parsedIndex]) {
        return options[parsedIndex].key;
      }

      const matchedByLabel = options.find(
        (option) => option.label.toLowerCase() === trimmed.toLowerCase(),
      );
      if (matchedByLabel) {
        return matchedByLabel.key;
      }
    }

    const rawCorrectIndex = question.correctAnswerIndex;
    if (
      typeof rawCorrectIndex === 'number' &&
      Number.isInteger(rawCorrectIndex) &&
      options[rawCorrectIndex]
    ) {
      return options[rawCorrectIndex].key;
    }

    if (typeof rawCorrectIndex === 'string') {
      const parsed = Number(rawCorrectIndex);
      if (!Number.isNaN(parsed) && Number.isInteger(parsed) && options[parsed]) {
        return options[parsed].key;
      }
    }

    return options[0].key;
  }

  private normalizeQuestions(rawQuestions: unknown): QuizQuestionPayload[] {
    if (!Array.isArray(rawQuestions)) {
      return [];
    }

    return rawQuestions
      .map((rawQuestion) => {
        if (!rawQuestion || typeof rawQuestion !== 'object') {
          return null;
        }

        const question = rawQuestion as Record<string, unknown>;
        const rawText = question.text ?? question.questionText ?? question.question;
        const text = typeof rawText === 'string' ? rawText.trim() : '';

        if (!text) {
          return null;
        }

        const rawOptions = question.options;
        if (!Array.isArray(rawOptions)) {
          return null;
        }

        const options = rawOptions
          .map((rawOption, index) => {
            if (typeof rawOption === 'string') {
              const label = rawOption.trim();
              if (!label) {
                return null;
              }
              return { key: this.getOptionKey(index), label };
            }

            if (!rawOption || typeof rawOption !== 'object') {
              return null;
            }

            const optionRecord = rawOption as Record<string, unknown>;
            const rawLabel = optionRecord.label ?? optionRecord.text ?? optionRecord.value;
            const label = typeof rawLabel === 'string' ? rawLabel.trim() : '';
            if (!label) {
              return null;
            }

            const rawKey =
              typeof optionRecord.key === 'string' ? optionRecord.key.trim().toUpperCase() : '';

            return {
              key: rawKey || this.getOptionKey(index),
              label,
            };
          })
          .filter((option): option is QuizOptionPayload => Boolean(option))
          .map((option, index) => ({
            key: /^[A-Z]$/.test(option.key) ? option.key : this.getOptionKey(index),
            label: option.label,
          }));

        if (options.length < 2) {
          return null;
        }

        const id =
          typeof question.id === 'string' && question.id.trim().length > 0
            ? question.id.trim()
            : randomUUID();

        return {
          id,
          text,
          options,
          correctAnswer: this.resolveCorrectAnswer(question, options),
        };
      })
      .filter((question): question is QuizQuestionPayload => Boolean(question));
  }

  private buildAiPrompt(generateAiQuizDto: GenerateAiQuizDto): string {
    const questionCount = generateAiQuizDto.questionCount ?? 10;
    const difficulty = generateAiQuizDto.difficulty ?? 'medium';
    const language = (generateAiQuizDto.language || 'vi').trim();
    const additionalInstructions = (generateAiQuizDto.additionalInstructions || '').trim();

    return [
      'You are an expert instructor who writes high-quality multiple-choice quizzes.',
      `Language: ${language}`,
      `Topic: ${generateAiQuizDto.topic}`,
      `Difficulty: ${difficulty}`,
      `Number of questions: ${questionCount}`,
      'Requirements:',
      '- Every question must have exactly 4 options with keys A, B, C, D.',
      '- Exactly one correct answer per question.',
      '- Keep wording clear and unambiguous.',
      '- Avoid duplicate questions.',
      '- Return ONLY a valid JSON array, no markdown, no explanation.',
      'JSON shape:',
      '[{"text":"Question text","options":[{"key":"A","label":"Option A"},{"key":"B","label":"Option B"},{"key":"C","label":"Option C"},{"key":"D","label":"Option D"}],"correctAnswer":"A"}]',
      additionalInstructions ? `Additional instructions: ${additionalInstructions}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private parseGeneratedQuestions(rawResponse: string): QuizQuestionPayload[] {
    const text = rawResponse.trim();
    if (!text) {
      return [];
    }

    const candidates: string[] = [text];

    const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fencedMatch?.[1]) {
      candidates.push(fencedMatch[1].trim());
    }

    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch?.[0]) {
      candidates.push(arrayMatch[0].trim());
    }

    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate);
        const normalized = this.normalizeQuestions(parsed);
        if (normalized.length > 0) {
          return normalized;
        }
      } catch {
        continue;
      }
    }

    return [];
  }

  async create(createQuizDto: CreateQuizDto): Promise<CommonResponse<Quiz>> {
    const payload: CreateQuizDto = { ...createQuizDto };

    if (Object.prototype.hasOwnProperty.call(createQuizDto, 'questions')) {
      const normalizedQuestions = this.normalizeQuestions(createQuizDto.questions);
      payload.questions = normalizedQuestions;
      payload.totalQuestions = normalizedQuestions.length;
    }

    const quiz = this.quizRepository.create(payload);
    const savedQuiz = await this.quizRepository.save(quiz);
    return new SuccessResponse(savedQuiz, HttpStatus.CREATED);
  }

  async generateWithAi(generateAiQuizDto: GenerateAiQuizDto): Promise<CommonResponse<Quiz>> {
    if (!this.geminiModel) {
      return new ErrorResponse('Gemini API not configured', HttpStatus.SERVICE_UNAVAILABLE);
    }

    try {
      const prompt = this.buildAiPrompt(generateAiQuizDto);
      const result = await this.geminiModel.generateContent(prompt);
      const generatedText =
        result && result.response && typeof result.response.text === 'function'
          ? result.response.text()
          : '';

      const questions = this.parseGeneratedQuestions(generatedText);

      if (questions.length === 0) {
        return new ErrorResponse(
          'Gemini did not return a valid quiz format',
          HttpStatus.BAD_REQUEST,
        );
      }

      const quiz = this.quizRepository.create({
        title: generateAiQuizDto.title,
        description: generateAiQuizDto.description,
        duration: generateAiQuizDto.duration ?? 30,
        questions,
        totalQuestions: questions.length,
        maxAttempts: generateAiQuizDto.maxAttempts ?? 1,
        passingScore: generateAiQuizDto.passingScore ?? 70,
        shuffleQuestions: generateAiQuizDto.shuffleQuestions ?? true,
        showCorrectAnswers: generateAiQuizDto.showCorrectAnswers ?? true,
        isVisible: generateAiQuizDto.isVisible ?? true,
        courseId: generateAiQuizDto.courseId,
      });

      const savedQuiz = await this.quizRepository.save(quiz);
      return new SuccessResponse(savedQuiz, HttpStatus.CREATED);
    } catch (error) {
      console.error('AI quiz generation failed:', error);
      return new ErrorResponse('Failed to generate quiz with AI', HttpStatus.BAD_GATEWAY);
    }
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

    const payload: UpdateQuizDto = { ...updateQuizDto };

    if (Object.prototype.hasOwnProperty.call(updateQuizDto, 'questions')) {
      const normalizedQuestions = this.normalizeQuestions(updateQuizDto.questions);
      payload.questions = normalizedQuestions;
      payload.totalQuestions = normalizedQuestions.length;
    }

    Object.assign(quiz, payload);
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

  async getAttemptsForTeacher(
    quizId: string,
    currentUser: User,
  ): Promise<CommonResponse<TeacherQuizAttemptsResponse>> {
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId },
      relations: ['course'],
    });

    if (!quiz) {
      return new ErrorResponse('Quiz not found', HttpStatus.NOT_FOUND);
    }

    if (currentUser.role === UserRole.STUDENT) {
      return new ErrorResponse('Forbidden', HttpStatus.FORBIDDEN);
    }

    if (currentUser.role === UserRole.TEACHER) {
      const course = quiz.course
        ? quiz.course
        : await this.courseRepository.findOne({ where: { id: quiz.courseId } });

      if (!course || course.teacherId !== currentUser.id) {
        return new ErrorResponse('Forbidden: you do not own this quiz', HttpStatus.FORBIDDEN);
      }
    }

    const attempts = await this.quizAttemptRepository
      .createQueryBuilder('attempt')
      .leftJoin('attempt.student', 'student')
      .where('attempt.quizId = :quizId', { quizId })
      .select([
        'attempt.id',
        'attempt.quizId',
        'attempt.studentId',
        'attempt.status',
        'attempt.score',
        'attempt.correctAnswers',
        'attempt.totalAnswered',
        'attempt.startedAt',
        'attempt.completedAt',
        'attempt.timeSpent',
        'attempt.createdAt',
        'attempt.updatedAt',
        'student.id',
        'student.firstName',
        'student.lastName',
        'student.email',
        'student.avatar',
      ])
      .orderBy('attempt.createdAt', 'DESC')
      .getMany();

    const mappedAttempts: TeacherQuizAttemptItem[] = attempts.map((attempt) => {
      const firstName = attempt.student?.firstName?.trim() || '';
      const lastName = attempt.student?.lastName?.trim() || '';
      const fullName = `${firstName} ${lastName}`.trim();

      return {
        id: attempt.id,
        studentId: attempt.studentId,
        studentName: fullName || attempt.student?.email || 'Unknown student',
        studentEmail: attempt.student?.email || '',
        studentAvatar: attempt.student?.avatar || null,
        status: attempt.status,
        score: Number(attempt.score || 0),
        correctAnswers: attempt.correctAnswers || 0,
        totalAnswered: attempt.totalAnswered || 0,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt || null,
        timeSpent: attempt.timeSpent || 0,
        createdAt: attempt.createdAt,
        updatedAt: attempt.updatedAt,
      };
    });

    const completedAttempts = mappedAttempts.filter(
      (attempt) => attempt.status === AttemptStatus.COMPLETED,
    );
    const totalScore = completedAttempts.reduce((sum, attempt) => sum + attempt.score, 0);
    const averageScore =
      completedAttempts.length > 0
        ? Number((totalScore / completedAttempts.length).toFixed(2))
        : 0;
    const highestScore =
      completedAttempts.length > 0
        ? Math.max(...completedAttempts.map((attempt) => attempt.score))
        : 0;
    const passedAttempts = completedAttempts.filter(
      (attempt) => attempt.score >= Number(quiz.passingScore || 0),
    ).length;
    const passRate =
      completedAttempts.length > 0
        ? Number(((passedAttempts / completedAttempts.length) * 100).toFixed(2))
        : 0;

    return new SuccessResponse({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        totalQuestions: quiz.totalQuestions || 0,
        maxAttempts: quiz.maxAttempts || 0,
        passingScore: Number(quiz.passingScore || 0),
      },
      summary: {
        totalAttempts: mappedAttempts.length,
        completedAttempts: completedAttempts.length,
        inProgressAttempts: mappedAttempts.filter(
          (attempt) => attempt.status === AttemptStatus.IN_PROGRESS,
        ).length,
        timedOutAttempts: mappedAttempts.filter(
          (attempt) => attempt.status === AttemptStatus.TIMED_OUT,
        ).length,
        totalStudents: new Set(mappedAttempts.map((attempt) => attempt.studentId)).size,
        averageScore,
        highestScore,
        passRate,
      },
      attempts: mappedAttempts,
    });
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
