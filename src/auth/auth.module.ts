import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from 'src/user/entities/user.entity';
import { Session } from 'src/session/entities/session.entity';
import { PasswordResetToken } from 'src/password-reset/entities/password-reset.entity';
import { Teacher } from 'src/teacher/entities/teacher.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Session, PasswordResetToken, Teacher]),
    MulterModule.register(),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
