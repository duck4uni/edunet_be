import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { AuthGuard } from 'src/core/guards/auth.guard';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { PaginationParams, Pagination } from 'src/core/decorators/pagination-params.decorator';
import { SortingParams, Sorting } from 'src/core/decorators/sorting-params.decorator';
import { FilteringParams, Filtering } from 'src/core/decorators/filtering-params.decorator';
import { IncludeRelations, Including } from 'src/core/decorators/including-params.decorator';

@Controller('quizzes')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() createQuizDto: CreateQuizDto) {
    return this.quizService.create(createQuizDto);
  }

  @Get()
  findAll(
    @PaginationParams() pagination: Pagination,
    @SortingParams() sorts: Sorting[] | null,
    @FilteringParams() filters: Filtering[] | null,
    @IncludeRelations() includes: Including | null,
  ) {
    return this.quizService.findAll(pagination, sorts, filters, includes);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quizService.findOne(id);
  }

  @Get('course/:courseId')
  findByCourse(@Param('courseId') courseId: string) {
    return this.quizService.findByCourse(courseId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() updateQuizDto: UpdateQuizDto) {
    return this.quizService.update(id, updateQuizDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.quizService.remove(id);
  }

  // Quiz Attempt endpoints
  @Post(':id/start')
  @UseGuards(AuthGuard)
  startAttempt(@Param('id') quizId: string, @CurrentUser() user: any) {
    return this.quizService.startAttempt(quizId, user.id);
  }

  @Post('attempts/:attemptId/submit')
  @UseGuards(AuthGuard)
  submitAttempt(
    @Param('attemptId') attemptId: string,
    @Body('answers') answers: object,
    @Body('score') score: number,
    @Body('correctAnswers') correctAnswers: number,
  ) {
    return this.quizService.submitAttempt(attemptId, answers, score, correctAnswers);
  }

  @Get('attempts/:attemptId')
  @UseGuards(AuthGuard)
  getAttemptById(@Param('attemptId') attemptId: string) {
    return this.quizService.findAttemptById(attemptId);
  }

  @Get(':id/attempts')
  @UseGuards(AuthGuard)
  getStudentAttempts(@Param('id') quizId: string, @CurrentUser() user: any) {
    return this.quizService.getStudentAttempts(quizId, user.id);
  }

  @Get(':id/best-score')
  @UseGuards(AuthGuard)
  getBestScore(@Param('id') quizId: string, @CurrentUser() user: any) {
    return this.quizService.getBestScore(quizId, user.id);
  }
}
