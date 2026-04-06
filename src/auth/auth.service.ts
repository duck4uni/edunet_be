import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { LoginDto, RegisterDto, RegisterTeacherDto } from './dto';
import { JwtService } from 'src/core/services/jwt.service';
import { omit } from 'src/core/utils';
import { ErrorMessages } from 'src/core/types';
import { ExpressRequest } from 'src/core/types/express-request.interface';
import { User, UserRole } from 'src/user/entities/user.entity';
import { Session } from 'src/session/entities/session.entity';
import { PasswordResetToken } from 'src/password-reset/entities/password-reset.entity';
import { Teacher } from 'src/teacher/entities/teacher.entity';
import { generatePasswordResetToken } from 'src/core/utils/password-reset.utils';
import { ErrorResponse, SuccessResponse } from 'src/core/responses/base.responses';
import { CommonResponse } from 'src/core/types/response';

export interface LoginResponse {
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
  ) {}

  /**
   * Login a user using password
   */
  async login(loginDto: LoginDto): Promise<CommonResponse<LoginResponse>> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email.toLowerCase().trim() },
    });

    if (!user) {
      return new ErrorResponse('User not found', HttpStatus.NOT_FOUND);
    }

    const isPasswordMatch = await new JwtService().checkPasswordMatch(loginDto.password, user.password);

    if (!isPasswordMatch) {
      return new ErrorResponse('Invalid password', HttpStatus.BAD_REQUEST);
    }

    if (!user.isActive) {
      return new ErrorResponse(
        'Your account is pending approval. Please wait for admin review.',
        HttpStatus.FORBIDDEN,
      );
    }

    const token = new JwtService().generateJwtToken(user);
    const refreshToken = await new JwtService().generateRefreshToken();

    const newSession = this.sessionRepository.create({
      user,
      refreshToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
    });
    await this.sessionRepository.save(newSession);

    // Update last login
    user.lastLogin = new Date();
    await this.userRepository.save(user);

    return new SuccessResponse({
      user: omit(user, 'password'),
      accessToken: token,
      refreshToken,
    });
  }

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<CommonResponse<LoginResponse>> {
    const userByEmail = await this.userRepository.findOne({
      where: { email: registerDto.email.toLowerCase().trim() },
    });

    const errorResponse = {
      errors: {} as ErrorMessages,
    };

    if (userByEmail) {
      errorResponse.errors.email = 'Email has already been taken';
      return new ErrorResponse(errorResponse, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const hashedPassword = await new JwtService().generateHashedPassword(registerDto.password);

    const newUser = this.userRepository.create({
      ...registerDto,
      email: registerDto.email.toLowerCase().trim(),
      password: hashedPassword,
      role: registerDto.role || UserRole.STUDENT,
    });

    const createdUser = await this.userRepository.save(newUser);

    const token = new JwtService().generateJwtToken(createdUser);
    const refreshToken = await new JwtService().generateRefreshToken();

    const newSession = this.sessionRepository.create({
      user: createdUser,
      refreshToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    });
    await this.sessionRepository.save(newSession);

    return new SuccessResponse({
      user: omit(createdUser, 'password'),
      accessToken: token,
      refreshToken,
    });
  }

  /**
   * Get user profile from request
   */
  getProfile(request: ExpressRequest): CommonResponse<Omit<User, 'password'>> {
    const user = request.user as User;

    if (!user) {
      return new ErrorResponse('User not found', HttpStatus.NOT_FOUND);
    }

    return new SuccessResponse(omit(user, 'password'));
  }

  /**
   * Verify refresh token and generate new access token
   */
  async refreshToken(refreshToken: string): Promise<CommonResponse<{ accessToken: string }>> {
    const session = await this.sessionRepository.findOne({
      where: {
        refreshToken,
        isRevoked: false,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    if (!session) {
      return new ErrorResponse('Invalid or expired refresh token', HttpStatus.UNAUTHORIZED);
    }

    const newAccessToken = new JwtService().generateJwtToken(session.user);

    return new SuccessResponse({ accessToken: newAccessToken });
  }

  /**
   * Logout user by invalidating refresh token
   */
  async logout(refreshToken: string): Promise<CommonResponse> {
    const session = await this.sessionRepository.findOne({
      where: { refreshToken },
    });

    if (!session) {
      return new ErrorResponse('Invalid refresh token', HttpStatus.BAD_REQUEST);
    }

    session.isRevoked = true;
    await this.sessionRepository.save(session);

    return new SuccessResponse({ message: 'Logged out successfully' });
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<CommonResponse> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      // Don't reveal if email exists
      return new SuccessResponse({ message: 'If email exists, a reset link will be sent' });
    }

    const resetToken = generatePasswordResetToken(32);
    const passwordResetToken = this.passwordResetTokenRepository.create({
      user,
      token: resetToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
    });

    await this.passwordResetTokenRepository.save(passwordResetToken);

    // TODO: Send email with reset link
    // await this.emailService.sendPasswordResetEmail(user.email, token);

    return new SuccessResponse({ message: 'If email exists, a reset link will be sent' });
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<CommonResponse> {
    const passwordResetToken = await this.passwordResetTokenRepository.findOne({
      where: {
        token,
        isUsed: false,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    if (!passwordResetToken) {
      return new ErrorResponse('Invalid or expired reset token', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await new JwtService().generateHashedPassword(newPassword);
    passwordResetToken.user.password = hashedPassword;
    await this.userRepository.save(passwordResetToken.user);

    passwordResetToken.isUsed = true;
    await this.passwordResetTokenRepository.save(passwordResetToken);

    return new SuccessResponse({ message: 'Password reset successfully' });
  }

  async registerTeacher(
    dto: RegisterTeacherDto,
    cvFile: Express.Multer.File | undefined,
  ): Promise<CommonResponse<{ message: string }>> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      const errorResponse = { errors: { email: 'Email has already been taken' } as ErrorMessages };
      return new ErrorResponse(errorResponse, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    if (!cvFile) {
      return new ErrorResponse('CV file (PDF) is required for teacher registration', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await new JwtService().generateHashedPassword(dto.password);

    // Create user with isActive=false — will be activated on admin approval
    const newUser = this.userRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email.toLowerCase().trim(),
      password: hashedPassword,
      phone: dto.phone,
      role: UserRole.TEACHER,
      isActive: false,
    });
    const savedUser = await this.userRepository.save(newUser);

    // Build CV URL — served as static file
    const cvUrl = `/uploads/cv/${cvFile.filename}`;

    const count = await this.teacherRepository.count({ withDeleted: true });
    const teacherId = `TCH${String(count + 1).padStart(6, '0')}`;

    const teacher = this.teacherRepository.create({
      userId: savedUser.id,
      teacherId,
      qualification: dto.qualification,
      specialization: dto.specialization,
      experience: dto.experience,
      bio: dto.bio,
      cvUrl,
      status: 'pending',
    });
    await this.teacherRepository.save(teacher);

    return new SuccessResponse(
      { message: 'Registration submitted successfully. Please wait for admin approval.' },
      HttpStatus.CREATED,
    );
  }
}
