import { Body, Controller, Get, Post, Req, UploadedFile, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService, LoginResponse } from './auth.service';
import { BackendValidationPipe } from 'src/core/pipes/backendValidation.pipe';
import { ExpressRequest } from 'src/core/types/express-request.interface';
import { CommonResponse } from 'src/core/types/response';
import { AuthGuard } from 'src/core/guards/auth.guard';
import { LoginDto, RegisterDto, RegisterTeacherDto } from './dto';
import { User } from 'src/user/entities/user.entity';
import { cvUploadOptions } from 'src/core/config/upload.config';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  @UsePipes(new BackendValidationPipe())
  async login(@Body() loginDto: LoginDto): Promise<CommonResponse<LoginResponse>> {
    return await this.authService.login(loginDto);
  }

  @Post('/register')
  @UsePipes(new BackendValidationPipe())
  async register(@Body() registerDto: RegisterDto): Promise<CommonResponse<LoginResponse>> {
    return await this.authService.register(registerDto);
  }

  @Post('/register/teacher')
  @UseInterceptors(FileInterceptor('cv', cvUploadOptions))
  @ApiOperation({ summary: 'Teacher registration with CV upload (PDF). Account requires admin approval.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['firstName', 'email', 'password', 'cv'],
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 },
        phone: { type: 'string' },
        qualification: { type: 'string' },
        experience: { type: 'number' },
        bio: { type: 'string' },
        cv: { type: 'string', format: 'binary', description: 'CV file (PDF only, max 5MB)' },
      },
    },
  })
  async registerTeacher(
    @Body() dto: RegisterTeacherDto,
    @UploadedFile() cv: Express.Multer.File,
  ): Promise<CommonResponse<{ message: string }>> {
    return await this.authService.registerTeacher(dto, cv);
  }

  @Get('/profile')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  getProfile(@Req() request: ExpressRequest): CommonResponse<Omit<User, 'password'>> {
    return this.authService.getProfile(request);
  }

  @Post('/refresh')
  async refreshToken(@Body('refreshToken') refreshToken: string): Promise<CommonResponse<{ accessToken: string }>> {
    return await this.authService.refreshToken(refreshToken);
  }

  @Post('/logout')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  async logout(@Body('refreshToken') refreshToken: string): Promise<CommonResponse> {
    return await this.authService.logout(refreshToken);
  }

  @Post('/forgot-password')
  async forgotPassword(@Body('email') email: string): Promise<CommonResponse> {
    return await this.authService.forgotPassword(email);
  }

  @Post('/reset-password')
  async resetPassword(
    @Body('token') token: string,
    @Body('password') password: string,
  ): Promise<CommonResponse> {
    return await this.authService.resetPassword(token, password);
  }
}
