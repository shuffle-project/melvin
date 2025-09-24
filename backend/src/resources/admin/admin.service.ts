import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare } from 'bcrypt';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { AdminUserConfig } from 'src/config/config.interface';
import { DbService } from 'src/modules/db/db.service';
import { Project } from 'src/modules/db/schemas/project.schema';
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
import {
  PasswordResetMethod,
  ResetPasswordEntity,
} from './entities/reset-password.entity';
import { UserEntity, UserListEntity } from './entities/user-list.entity';

@Injectable()
export class AdminService {
  adminUser: AdminUserConfig;

  constructor(
    private pathService: PathService,
    private db: DbService,
    private configService: ConfigService,
    private authService: AuthService,
    private userService: UserService,
    private mailService: MailService,
  ) {
    this.adminUser = this.configService.get<AdminUserConfig>('adminUser');
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
    });
    return { token };
  }

  async createUser(createUserDto: CreateUserDto) {
    return this.authService.register({ ...createUserDto });
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

    const userWithProjects = {
      id: updatedUser._id.toString(),
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      projects: updatedUser.projects
        .filter((project) =>
          isSameObjectId((project as Project).createdBy, user),
        )
        .map((p) => p._id.toString()),
    };

    const usersWithProjectSizes = await this._connectUserWithProjectSizes([
      userWithProjects,
    ]);

    return usersWithProjectSizes[0];
  }

  async resetPassword(userId: string): Promise<ResetPasswordEntity> {
    const user = await this.db.userModel.findById(userId).exec();

    if (user === null) {
      throw new CustomBadRequestException('user_not_found');
    }

    const password = generateSecurePassword(20);
    this.authService.resetPasswortByUserId(userId, password);

    //TODO send mail only if mail is configured
    // await this.mailService.sendPasswordResetMail(user, password);

    // await this.mailService._sendMail(user.email, 'New Password', password);

    // TODO Return only if mail is not configured
    return { method: PasswordResetMethod.RETURN, password: password };
  }

  async deleteUser(userId: string) {
    return await this.userService.deleteUserById(userId);
  }

  async getUserList(): Promise<UserListEntity> {
    const initialUsers = await this.db.userModel
      .find()
      .populate('projects')
      .lean()
      .exec();

    const usersWithProjects = initialUsers.map((user) => ({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      projects: user.projects
        .filter((project) =>
          isSameObjectId((project as Project).createdBy, user),
        )
        .map((p) => p._id.toString()),
    }));

    const usersWithProjectSizes = await this._connectUserWithProjectSizes(
      usersWithProjects,
    );

    return {
      users: usersWithProjectSizes,
    };
  }

  // TODO add type to userWithProjects?
  private async _connectUserWithProjectSizes(userWithProjects) {
    return await Promise.all(
      userWithProjects.map(async (user) => {
        const projects = await Promise.all(
          user.projects.map(async (project) => {
            const size = await this._getProjectSize(project);
            return { id: project, mbOnDisc: size };
          }),
        );
        return {
          mbOnDisc: projects.reduce((a, b) => a + b.mbOnDisc, 0),
          ...user,
          projects,
        };
      }),
    );
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
