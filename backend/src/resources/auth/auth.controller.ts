import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { User } from './auth.decorator';
import { AuthUser } from './auth.interfaces';
import { AuthService } from './auth.service';
import { AuthLoginDto, AuthLoginResponseDto } from './dto/auth-login.dto';
import {
  AuthRefreshTokenDto,
  AuthRefreshTokenResponseDto,
} from './dto/auth-refresh-token.dto';
import { AuthRegisterDto } from './dto/auth-register.dto';
import {
  AuthVerifyEmailDto,
  AuthVerifyEmailResponseDto,
} from './dto/auth-verify-email.dto';
import { AuthViewerLoginDto } from './dto/auth-viewer.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordByTokenDto } from './dto/reset-password-by-token.dto';
import { AuthInviteEntity } from './entities/auth-invite.entity';
import { AuthViewerLoginResponseEntity } from './entities/auth-viewer.entity';
import { ChangePasswordEntity } from './entities/change-password.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  async login(@Body() dto: AuthLoginDto): Promise<AuthLoginResponseDto> {
    return this.authService.login(dto);
  }

  @Post('/change-password')
  async changePassword(
    @Body() dto: ChangePasswordDto,
  ): Promise<ChangePasswordEntity> {
    return this.authService.changePassword(dto);
  }

  @Post('/refresh-token')
  async refreshToken(
    @Body() dto: AuthRefreshTokenDto,
  ): Promise<AuthRefreshTokenResponseDto> {
    return this.authService.refreshToken(dto);
  }

  @Post('/register')
  async register(@Body() dto: AuthRegisterDto): Promise<any> {
    return this.authService.register(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/verify-email/request')
  async sendVerifyEmail(@User() authUser: AuthUser) {
    return this.authService.sendVerifyEmail(authUser);
  }

  @Post('/verify-email/confirm')
  async verifyEmail(
    @Body() dto: AuthVerifyEmailDto,
  ): Promise<AuthVerifyEmailResponseDto> {
    return this.authService.verifyEmail(dto);
  }

  @Get('/verify-invite/:inviteToken')
  async verifyInvite(
    @Param('inviteToken') token: string,
  ): Promise<AuthInviteEntity> {
    return this.authService.verifyInvite(token);
  }

  @Post('/viewer-login')
  async viewerLogin(
    @Body() dto: AuthViewerLoginDto,
  ): Promise<AuthViewerLoginResponseEntity> {
    return this.authService.viewerLogin(dto);
  }

  @Post('/reset-password/request')
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    return this.authService.forgotPassword(dto);
  }

  @Post('/reset-password/confirm')
  resetPasswordByToken(@Body() dto: ResetPasswordByTokenDto): Promise<void> {
    return this.authService.resetPasswordByToken(dto);
  }
}
