import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { MailService } from 'src/modules/mail/mail.service';
import { v4 } from 'uuid';
import { JwtConfig, RegistrationConfig } from '../../config/config.interface';
import { DbService } from '../../modules/db/db.service';
import { User } from '../../modules/db/schemas/user.schema';
import { PermissionsService } from '../../modules/permissions/permissions.service';
import { generateSecureToken } from '../../utils/crypto';
import {
  CustomBadRequestException,
  CustomForbiddenException,
  CustomInternalServerException,
} from '../../utils/exceptions';
import { PopulateService } from '../populate/populate.service';
import { UserRole } from '../user/user.interfaces';
import {
  AuthUser,
  DecodedToken,
  JwtPayload,
  MediaAccessJwtPayload,
} from './auth.interfaces';
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
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordByTokenDto } from './dto/reset-password-by-token.dto';
import { AuthInviteEntity } from './entities/auth-invite.entity';
import { AuthViewerLoginResponseEntity } from './entities/auth-viewer.entity';
import { ChangePasswordEntity } from './entities/change-password.entity';

interface SignTokenUser {
  _id: string | Types.ObjectId;
  role: UserRole;
  name: string;
  email: string;
  isEmailVerified: boolean;
}

@Injectable()
export class AuthService {
  private config: JwtConfig;
  private registrationConfig: RegistrationConfig;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private db: DbService,
    private mailService: MailService,
    private permissions: PermissionsService,
    private populateService: PopulateService,
  ) {
    this.config = this.configService.get<JwtConfig>('jwt');
    this.registrationConfig =
      this.configService.get<RegistrationConfig>('registration');
  }

  async changePassword(dto: ChangePasswordDto): Promise<ChangePasswordEntity> {
    // Find user by email
    const user = await this.db.userModel
      .findOne({ email: dto.email.toLowerCase() })
      .lean()
      .exec();

    // Invalid email
    if (!user) {
      throw new CustomBadRequestException('unknown_email');
    }

    // Block system user login
    if (user.role === UserRole.SYSTEM) {
      throw new CustomForbiddenException('system_user_login_is_blocked');
    }

    // Invalid password
    const isMatch = await bcrypt.compare(dto.oldPassword, user.hashedPassword);

    if (!isMatch) {
      throw new CustomBadRequestException('invalid_password');
    }

    // update password
    const newHashedPassword = await bcrypt.hash(dto.newPassword, 10);

    const updatedUser = await this.db.userModel.findByIdAndUpdate(
      user._id,
      {
        $set: { hashedPassword: newHashedPassword },
      },
      { new: true },
    );

    // Create access token
    const token = this.createAccessToken(updatedUser);

    return { token };
  }

  async login(dto: AuthLoginDto): Promise<AuthLoginResponseDto> {
    // Find user by email
    const user = await this.db.userModel
      .findOne({ email: dto.email.toLowerCase() })
      .lean()
      .exec();

    // Invalid email
    if (!user) {
      throw new CustomBadRequestException('unknown_email');
    }

    // Block system user login
    if (user.role === UserRole.SYSTEM) {
      throw new CustomForbiddenException('system_user_login_is_blocked');
    }

    // Invalid password
    const isMatch = await bcrypt.compare(dto.password, user.hashedPassword);

    if (!isMatch) {
      throw new CustomBadRequestException('invalid_password');
    }

    // Create access token
    const token = this.createAccessToken(user);

    return { token };
  }

  async refreshToken(
    dto: AuthRefreshTokenDto,
  ): Promise<AuthRefreshTokenResponseDto> {
    // Decode token and get user id
    const decodedToken = this.jwtService.decode(dto.token) as DecodedToken;

    // Find user by id
    const user = await this.db.userModel
      .findById(decodedToken.id)
      .lean()
      .exec();

    // Unknown user
    if (!user) {
      throw new CustomBadRequestException('unknown_user');
    }

    // Create access token
    const token = this.createAccessToken(user);

    return { token };
  }

  async register(dto: AuthRegisterDto, adminService = false): Promise<void> {
    //TODO  block if registration is disabled

    if (this.registrationConfig.mode === 'disabled' && !adminService) {
      throw new CustomForbiddenException('registration_disabled');
    }

    // Get user by email
    const exists = await this.db.userModel
      .findOne({
        email: dto.email.toLowerCase(),
      })
      .lean()
      .exec();

    // Duplicate email
    if (exists) {
      throw new CustomBadRequestException('email_already_taken');
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const emailVerificationToken = generateSecureToken();

    const user = await this.db.userModel.create({
      email: dto.email.toLowerCase(),
      hashedPassword,
      role: UserRole.USER,
      name: dto.name,
      isEmailVerified: false,
      emailVerificationToken,
      // projects: [EXAMPLE_PROJECT._id],
      projects: [],
    });

    // Add user to default project
    // await this.db.projectModel.findByIdAndUpdate(EXAMPLE_PROJECT._id, {
    //   $push: { users: user._id.toString() },
    // });

    //  Create default project
    // await this.populateService._generateDefaultProject(user);

    if (this.mailService.isActive())
      await this.mailService.sendVerifyEmail(user);

    // TODO: Send email with verificationToken
  }

  async sendVerifyEmail(authUser: AuthUser): Promise<void> {
    const user = await this.db.userModel.findById(authUser.id);
    await this.mailService.sendVerifyEmail(user);
  }

  async verifyEmail(
    dto: AuthVerifyEmailDto,
  ): Promise<AuthVerifyEmailResponseDto> {
    // Find user by verification token

    const user = await this.db.userModel
      .findOne({ email: dto.email.toLowerCase() })
      .exec();

    if (!user) {
      throw new CustomBadRequestException('unkown_verification_token');
    }

    if (user.isEmailVerified) {
      throw new CustomBadRequestException('email_already_verified');
    }

    // Unknown verificationToken
    if (!user || user.emailVerificationToken !== dto.token) {
      throw new CustomBadRequestException('unkown_verification_token');
    }

    const newVerificationToken = generateSecureToken();

    const newUser = await this.db.userModel.findOneAndUpdate(
      {
        isEmailVerified: false,
        emailVerificationToken: dto.token,
      },
      { emailVerificationToken: newVerificationToken, isEmailVerified: true },
      { new: true },
    );

    // Create access token
    const accessToken = this.createAccessToken(newUser);

    return { token: accessToken };
  }

  async verifyInvite(inviteToken: string): Promise<AuthInviteEntity> {
    const project = await this.db.projectModel
      .findOne({
        inviteToken,
      })
      .populate('createdBy')
      .lean();

    if (!project) {
      throw new CustomBadRequestException('Unknown invite token');
    }

    return {
      projectId: project._id.toString(),
      projectTitle: project.title,
      userName: (project.createdBy as User).name,
    };
  }

  async guestLogin(dto: AuthGuestLoginDto): Promise<AuthGuestLoginResponseDto> {
    // Verify invite token
    const project = await this.db.projectModel.findOne({
      inviteToken: dto.inviteToken,
    });

    if (!project) {
      throw new CustomBadRequestException('Unknown invite token');
    }

    // Create new guest user
    const user = await this.db.userModel.create({
      email: null,
      hashedPassword: null,
      role: UserRole.GUEST,
      name: dto.name,
      isEmailVerified: false,
      emailVerificationToken: null,
      projects: [project._id],
    });

    // Add guest user to project
    project.users.push(user._id);
    await project.save();

    // Create access token
    const token = this.createAccessToken(user);

    return { token, projectId: project._id.toString() };
  }

  async viewerLogin(
    dto: AuthViewerLoginDto,
  ): Promise<AuthViewerLoginResponseEntity> {
    const project = await this.db.projectModel.findOne({
      viewerToken: dto.viewerToken,
    });

    if (!project) {
      throw new CustomBadRequestException('Unknown viewer token');
    }

    const accessToken = this.createAccessToken({
      _id: project._id,
      role: UserRole.VIEWER,
      name: 'viewer',
      email: 'viewer',
      isEmailVerified: true, // TODO,
    });

    return { token: accessToken, projectId: project._id.toString() };
  }

  createAccessToken(user: SignTokenUser): string {
    const payload: JwtPayload = {
      id: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      // email verified
    };
    return this.jwtService.sign(payload, {
      algorithm: 'HS256',
      audience: this.config.audience,
      issuer: this.config.issuer,
      jwtid: v4(),
    });
  }

  verifyToken(token: string): any {
    return this.jwtService.verify(token);
  }

  decodeToken(token: string): any {
    return this.jwtService.decode(token);
  }

  createMediaAccessToken(
    // authUser: AuthUser,
    projectId: string,
  ): string {
    // const project = await this.db.findProjectByIdOrThrow(dto.projectId);

    // if (!this.permissions.isProjectMember(project, authUser)) {
    //   throw new CustomForbiddenException('access_to_project_denied');
    // }

    const payload: MediaAccessJwtPayload = {
      projectId,
    };

    const token = this.jwtService.sign(payload, {
      algorithm: 'HS256',
      audience: this.config.audience,
      issuer: this.config.issuer,
      jwtid: v4(),
      expiresIn: '8h',
    });
    return token;
  }

  async findSystemAuthUser(): Promise<AuthUser> {
    const user = await this.db.userModel
      .findOne({ role: UserRole.SYSTEM })
      .lean()
      .exec();

    if (user === null) {
      throw new CustomInternalServerException('system_user_not_found');
    }

    return {
      id: user._id.toString(),
      jwtId: v4(),
      role: user.role,
    };
  }

  async resetPasswortByUserId(userId: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.db.userModel
      .findByIdAndUpdate(userId, { hashedPassword })
      .exec();
  }

  // async resetPassword(email: string, newPassword: string): Promise<void> {
  //   const user = await this.db.userModel
  //     .findOne({ email: email.toLowerCase() })
  //     .exec();

  //   if (user === null) {
  //     throw new CustomInternalServerException('user_not_found');
  //   }

  //   await this.resetPasswortByUserId(user._id.toString(), newPassword);
  //   return;
  // }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    if (this.registrationConfig.mode === 'disabled') {
      throw new CustomForbiddenException('forgot_password_disabled');
    }

    let user = await this.db.userModel
      .findOne({ email: dto.email.toLowerCase() })
      .exec();

    if (!user.emailVerificationToken) {
      const newtoken = generateSecureToken();
      user = await this.db.userModel
        .findOneAndUpdate(
          { email: dto.email.toLowerCase() },
          { $set: { emailVerificationToken: newtoken } },
          { new: true },
        )
        .exec();
    }

    if (user) {
      await this.mailService.sendForgotPassword(user);
    }
  }

  async resetPasswordByToken(dto: ResetPasswordByTokenDto): Promise<void> {
    const user = await this.db.userModel
      .findOne({ email: dto.email.toLowerCase() })
      .exec();

    if (user === null) {
      throw new CustomInternalServerException('user_not_found');
    }

    if (dto.token !== user.emailVerificationToken) {
      throw new CustomBadRequestException('invalid_token');
    }

    await this.resetPasswortByUserId(user._id.toString(), dto.password);

    // reset token
    const newtoken = generateSecureToken();
    await this.db.userModel
      .findOneAndUpdate(
        { email: dto.email.toLowerCase() },
        { $set: { emailVerificationToken: newtoken, isEmailVerified: true } },
      )
      .exec();
  }
}
