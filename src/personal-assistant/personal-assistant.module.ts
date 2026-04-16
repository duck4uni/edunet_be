import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonalAssistantController } from './personal-assistant.controller';
import { PersonalAssistantService } from './personal-assistant.service';
import { Enrollment } from '../enrollment/entities/enrollment.entity';
import { Assignment } from '../assignment/entities/assignment.entity';
import { Schedule } from '../schedule/entities/schedule.entity';
import { Course } from '../course/entities/course.entity';
import { Quiz } from '../quiz/entities/quiz.entity';
import { QuizAttempt } from '../quiz/entities/quiz-attempt.entity';
import { Lesson } from '../lesson/entities/lesson.entity';
import { Material } from '../material/entities/material.entity';
import { Category } from '../category/entities/category.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Enrollment,
      Assignment,
      Schedule,
      Course,
      Quiz,
      QuizAttempt,
      Lesson,
      Material,
      Category,
      User,
    ]),
  ],
  controllers: [PersonalAssistantController],
  providers: [PersonalAssistantService],
})
export class PersonalAssistantModule {}
