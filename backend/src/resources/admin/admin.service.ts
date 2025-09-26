import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare } from 'bcrypt';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import {
  AdminUserConfig,
  RegistrationConfig,
  RegistrationMode,
} from 'src/config/config.interface';
import { DbService } from 'src/modules/db/db.service';
import { Project } from 'src/modules/db/schemas/project.schema';
import { User } from 'src/modules/db/schemas/user.schema';
import { MailService } from 'src/modules/mail/mail.service';
import { PathService } from 'src/modules/path/path.service';
import { generateSecurePassword } from 'src/utils/crypto';
import { CustomBadRequestException } from 'src/utils/exceptions';
import { isSameObjectId } from 'src/utils/objectid';
import { AuthService } from '../auth/auth.service';
import { AuthLoginResponseDto } from '../auth/dto/auth-login.dto';
import { UserRole } from '../user/user.interfaces';
import { UserService } from '../user/user.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserEntity } from './entities/create-user.entity';
import {
  PasswordResetMethod,
  ResetPasswordEntity,
} from './entities/reset-password.entity';
import { UserEntity, UserListEntity } from './entities/user-list.entity';

@Injectable()
export class AdminService {
  adminUser: AdminUserConfig;
  registrationConfig: RegistrationConfig;

  constructor(
    private pathService: PathService,
    private db: DbService,
    private configService: ConfigService,
    private authService: AuthService,
    private userService: UserService,
    private mailService: MailService,
  ) {
    this.adminUser = this.configService.get<AdminUserConfig>('adminUser');
    this.registrationConfig =
      this.configService.get<RegistrationConfig>('registration');
  }

  async adminLogin(dto: AdminLoginDto): Promise<AuthLoginResponseDto> {
    let isMatch: boolean = false;

    if (this.adminUser.hashedPassword) {
      // check username prefix
      const usernamePrefix = `${this.adminUser.username}:`;
      if (this.adminUser.hashedPassword.startsWith(usernamePrefix)) {
        this.adminUser.hashedPassword = this.adminUser.hashedPassword.replace(
          usernamePrefix,
          '',
        );
      }
      // check version prefix
      if (!this.adminUser.hashedPassword.startsWith('$2b$')) {
        const prefixRegex = /^\$2.\$/;
        this.adminUser.hashedPassword = this.adminUser.hashedPassword.replace(
          prefixRegex,
          '$2b$',
        );
      }

      const compared = await compare(
        dto.password,
        this.adminUser.hashedPassword,
      );
      isMatch = dto.username === this.adminUser.username && compared;
    } else if (this.adminUser.password) {
      isMatch =
        dto.username === this.adminUser.username &&
        dto.password === this.adminUser.password;
    } else {
      throw new CustomBadRequestException('admin_login_not_configured');
    }

    if (!isMatch) {
      throw new CustomBadRequestException('invalid_credentials');
    }
    const token = this.authService.createAccessToken({
      _id: 'admin',
      name: this.adminUser.username,
      email: 'admin',
      role: UserRole.ADMIN,
      isEmailVerified: true,
    });
    return { token };
  }

  async createUser(createUserDto: CreateUserDto): Promise<CreateUserEntity> {
    // Get user by email
    const exists = await this.db.userModel
      .findOne({
        email: createUserDto.email.toLowerCase(),
      })
      .lean()
      .exec();

    console.log('----');
    console.log(exists);
    console.log('----');

    // Duplicate email
    if (exists) {
      throw new CustomBadRequestException('email_already_taken');
    }

    const password = generateSecurePassword(20);

    await this.authService.register(
      { ...createUserDto, password: password },
      true,
    );

    const user = await this.db.userModel
      .findOneAndUpdate(
        { email: createUserDto.email },
        { $set: { isEmailVerified: true } },
        { new: true },
      )
      .populate('projects')
      .exec();

    const userEntity = await this.toUserEntity(user);

    if (this.registrationConfig.mode === RegistrationMode.EMAIL) {
      await this.mailService.sendAdminCreateUserMail(createUserDto, password);
      return { method: PasswordResetMethod.EMAIL, user: userEntity };
    } else {
      return {
        method: PasswordResetMethod.RETURN,
        password: password,
        user: userEntity,
      };
    }
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.db.userModel.findById(id).lean().exec();

    if (user === null) {
      throw new CustomBadRequestException('user_not_found');
    }

    await this.db.userModel.findByIdAndUpdate(id, dto);

    const updatedUser = await this.db.userModel
      .findById(id)
      .populate('projects')
      .lean()
      .exec();

    return this.toUserEntity(updatedUser);
  }

  async resetPassword(userId: string): Promise<ResetPasswordEntity> {
    const user = await this.db.userModel.findById(userId).exec();

    if (user === null) {
      throw new CustomBadRequestException('user_not_found');
    }

    const password = generateSecurePassword(20);
    this.authService.resetPasswortByUserId(userId, password);

    if (this.registrationConfig.mode === RegistrationMode.EMAIL) {
      await this.mailService.sendPasswordResetMail(user, password);
      return { method: PasswordResetMethod.EMAIL };
    } else {
      return { method: PasswordResetMethod.RETURN, password: password };
    }
  }

  async deleteUser(userId: string) {
    return await this.userService.deleteUserById(userId);
  }

  async getUserList(): Promise<UserListEntity> {
    const initialUsers = await this.db.userModel
      .find()
      .sort({ email: 1 })
      .populate('projects')
      .lean()
      .exec();

    const users = await Promise.all(
      initialUsers
        .filter((user) => user.role !== UserRole.SYSTEM)
        .map((user) => this.toUserEntity(user)),
    );

    return { users };
  }

  private async toUserEntity(user: User): Promise<UserEntity> {
    user.projects.forEach((project) => {
      // TODO evlt nur in der testumgebung? was tun hier?
      if (
        (project as Project).duration === undefined ||
        (project as Project).duration === null
      )
        (project as Project).duration = 0;
    });

    const accumulatedDuration = user.projects
      .filter((project) => isSameObjectId((project as Project).createdBy, user))
      .reduce((a, b) => a + (b as Project).duration, 0);

    const projects = await Promise.all(
      user.projects.map(async (project) => {
        const size = await this._getProjectSize(project._id.toString());
        return { project, mbOnDisc: size };
      }),
    );

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      projectCount: projects.length,
      mbOnDisc: projects.reduce((a, b) => a + b.mbOnDisc, 0),
      accumulatedDuration,
    };
  }

  private async _getProjectSize(projectId: string) {
    const projectPath = this.pathService.getProjectDirectory(projectId);

    const projectFiles = await readdir(projectPath);

    const sizes = await Promise.all(
      projectFiles.map(async (file) => {
        const fileStats = await stat(join(projectPath, file));
        if (fileStats.isSymbolicLink()) return 0;
        return fileStats.size / 1000 / 1000;
      }),
    );

    const size = sizes.reduce((a, b) => a + b, 0);
    return size;
  }
}
