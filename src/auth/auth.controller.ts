import { Body, Controller, Get, Post, Req, UseGuards, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService, LoginResponse } from './auth.service';
import { BackendValidationPipe } from 'src/core/pipes/backendValidation.pipe';
import { ExpressRequest } from 'src/core/types/express-request.interface';
import { CommonResponse } from 'src/core/types/response';
import { AuthGuard } from 'src/core/guards/auth.guard';
import { LoginDto, RegisterDto } from './dto';
import { User } from 'src/user/entities/user.entity';

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
