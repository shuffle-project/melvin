import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  AuthGuestLoginDto,
  AuthGuestLoginResponseDto,
} from './dto/auth-guest-login.dto';
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
import { AuthInviteEntity } from './entities/auth-invite.entity';
import { AuthViewerLoginResponseEntity } from './entities/auth-viewer.entity';
import { ChangePasswordEntity } from './entities/change-password.entity';
import { BasicAuthGuard } from './guards/basic-auth.guard';

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

  // @UseGuards(JwtAuthGuard)
  // @Post('/media-access-token')
  // async createMediaAccessToken(
  //   @User() authUser: AuthUser,
  //   @Body() dto: AuthMediaAccessTokenDto,
  // ): Promise<{ token: string }> {
  //   return this.authService.createMediaAccessToken(authUser, dto);
  // }

  @Post('/register')
  async register(@Body() dto: AuthRegisterDto): Promise<any> {
    return this.authService.register(dto);
  }

  @Post('/verify-email')
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

  @Post('/guest-login')
  async guestLogin(
    @Body() dto: AuthGuestLoginDto,
  ): Promise<AuthGuestLoginResponseDto> {
    return this.authService.guestLogin(dto);
  }

  @Post('/viewer-login')
  async viewerLogin(
    @Body() dto: AuthViewerLoginDto,
  ): Promise<AuthViewerLoginResponseEntity> {
    return this.authService.viewerLogin(dto);
  }

  @UseGuards(BasicAuthGuard)
  @Post('reset-password')
  resetPassword(
    @Body() dto: { email: string; newPassword: string },
  ): Promise<any> {
    return this.authService.resetPassword(dto.email, dto.newPassword);
  }
}
