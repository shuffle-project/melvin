import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { v4 } from 'uuid';
import { JwtConfig } from '../../config/config.interface';
import { EXAMPLE_PROJECT } from '../../constants/example.constants';
import { DbService } from '../../modules/db/db.service';
import { LeanUserDocument, User } from '../../modules/db/schemas/user.schema';
import { PermissionsService } from '../../modules/permissions/permissions.service';
import {
  CustomBadRequestException,
  CustomForbiddenException,
  CustomInternalServerException,
} from '../../utils/exceptions';
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
import { AuthMediaAccessTokenDto } from './dto/auth-media-access-token.dto';
import {
  AuthRefreshTokenDto,
  AuthRefreshTokenResponseDto,
} from './dto/auth-refresh-token.dto';
import { AuthRegisterDto } from './dto/auth-register.dto';
import {
  AuthVerifyEmailDto,
  AuthVerifyEmailResponseDto,
} from './dto/auth-verify-email.dto';
import { AuthInviteEntity } from './entities/auth-invite.entity';

@Injectable()
export class AuthService {
  private config: JwtConfig;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private db: DbService,
    private permissions: PermissionsService,
  ) {
    this.config = this.configService.get<JwtConfig>('jwt');
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

  async register(dto: AuthRegisterDto): Promise<void> {
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
    const emailVerificationToken = randomBytes(32).toString();

    const user = await this.db.userModel.create({
      email: dto.email.toLowerCase(),
      hashedPassword,
      role: UserRole.USER,
      name: dto.name,
      isEmailVerified: false,
      emailVerificationToken,
      projects: [EXAMPLE_PROJECT._id],
    });

    // Add user to default project
    await this.db.projectModel.findByIdAndUpdate(EXAMPLE_PROJECT._id, {
      $push: { users: user._id.toString() },
    });

    // add user to default project

    // TODO: Send email with verificationToken
  }

  async verifyEmail(
    dto: AuthVerifyEmailDto,
  ): Promise<AuthVerifyEmailResponseDto> {
    // Find user by verification token
    const user = await this.db.userModel.findOneAndUpdate(
      {
        isEmailVerified: false,
        emailVerificationToken: dto.verificationToken,
      },
      { emailVerificationToken: null, isEmailVerified: true },
      { new: true },
    );

    // Unknown verificationToken
    if (!user) {
      throw new CustomBadRequestException('unkown_verification_token');
    }

    // Create access token
    const token = this.createAccessToken(user);

    return { token };
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

    return { token };
  }

  createAccessToken(user: LeanUserDocument): string {
    const payload: JwtPayload = {
      id: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
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

  async createMediaAccessToken(
    authUser: AuthUser,
    dto: AuthMediaAccessTokenDto,
  ): Promise<{ token: string }> {
    const project = await this.db.findProjectByIdOrThrow(dto.projectId);

    if (!this.permissions.isProjectMember(project, authUser)) {
      throw new CustomForbiddenException('access_to_project_denied');
    }

    const payload: MediaAccessJwtPayload = {
      projectId: project._id.toString(),
    };

    const token = this.jwtService.sign(payload, {
      algorithm: 'HS256',
      audience: this.config.audience,
      issuer: this.config.issuer,
      jwtid: v4(),
      expiresIn: '8h',
    });
    return { token };
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
      role: user.role,
    };
  }
}
