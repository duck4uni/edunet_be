import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmConfig } from './core/config/typeorm.config';
import { CoreModule } from './core/core.module';
import { AuthModule } from './auth/auth.module';
import { AuthMiddleware } from './core/middlewares/auth.middleware';
import { UserModule } from './user/user.module';
import { SessionModule } from './session/session.module';
import { PasswordResetModule } from './password-reset/password-reset.module';
import { CategoryModule } from './category/category.module';
import { CourseModule } from './course/course.module';
import { TeacherModule } from './teacher/teacher.module';
import { StudentModule } from './student/student.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { LessonModule } from './lesson/lesson.module';
import { MaterialModule } from './material/material.module';
import { AssignmentModule } from './assignment/assignment.module';
import { QuizModule } from './quiz/quiz.module';
import { ReviewModule } from './review/review.module';
import { ScheduleModule } from './schedule/schedule.module';
import { SupportTicketModule } from './support-ticket/support-ticket.module';
import { ChatbotModule } from './chatbot/chatbot.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => getTypeOrmConfig(configService),
      inject: [ConfigService],
    }),
    CoreModule,
    AuthModule,
    UserModule,
    SessionModule,
    PasswordResetModule,
    CategoryModule,
    CourseModule,
    TeacherModule,
    StudentModule,
    EnrollmentModule,
    LessonModule,
    MaterialModule,
    AssignmentModule,
    QuizModule,
    ReviewModule,
    ScheduleModule,
    SupportTicketModule,
    ChatbotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }
}
