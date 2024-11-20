import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { readdir, stat } from 'fs-extra';
import { join } from 'path';
import { DbService } from '../..//modules/db/db.service';
import { EmailConfig } from '../../config/config.interface';
import { Project } from '../../modules/db/schemas/project.schema';
import { LeanUserDocument } from '../../modules/db/schemas/user.schema';
import { PathService } from '../../modules/path/path.service';
import { CustomInternalServerException } from '../../utils/exceptions';
import { isSameObjectId } from '../../utils/objectid';
import { AuthUser } from '../auth/auth.interfaces';
import { FindAllUsersQuery } from './dto/find-all-users.dto';
import { UserEntity } from './entities/user.entity';
import { UserRole } from './user.interfaces';

@Injectable()
export class UserService {
  constructor(
    private db: DbService,
    private configService: ConfigService,
    private pathService: PathService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const user = await this.db.userModel.findOne({ role: UserRole.SYSTEM });

    const { mailFrom } = this.configService.get<EmailConfig>('email');

    if (user === null) {
      // Create default system user
      await this.db.userModel.create({
        name: 'System',
        email: mailFrom,
        role: UserRole.SYSTEM,
        hashedPassword: null,
      });
    } else if (user.email !== mailFrom) {
      // Update system user as config changed
      await this.db.userModel
        .findByIdAndUpdate(user._id, { email: mailFrom })
        .exec();
    }
  }

  async findSystemUser(): Promise<LeanUserDocument> {
    const user = await this.db.userModel
      .findOne({ role: UserRole.SYSTEM })
      .lean()
      .exec();

    if (user === null) {
      throw new CustomInternalServerException('system_user_not_found');
    }

    return user;
  }

  async findAll(query: FindAllUsersQuery): Promise<UserEntity[]> {
    const users: LeanUserDocument[] = await this.db.userModel
      .find({
        $or: [
          { name: { $regex: query.search, $options: 'i' } },
          { email: { $regex: query.search, $options: 'i' } },
        ],
      })
      .limit(10)
      .sort({ name: 1 })
      .lean()
      .exec();

    return users.map((o) => plainToInstance(UserEntity, o));
  }

  async remove(authUser: AuthUser): Promise<void> {
    const user = await this.db.userModel.findById(authUser.id).exec();

    // remove all ownded projects of user
    await this.db.projectModel
      .deleteMany({ createdBy: authUser.id })
      .lean()
      .exec();

    // leave all projects of user
    await this.db.projectModel.updateMany(
      { users: { $in: [authUser.id] } },
      { $pull: { users: authUser.id } },
    );

    // remove user
    await this.db.userModel
      .findOneAndDelete({ _id: authUser.id })
      .lean()
      .exec();
  }

  async getAdminInfo(): Promise<any> {
    const initialUsers = await this.db.userModel
      .find()
      .populate('projects')
      .lean()
      .exec();

    const usersWithProjects = initialUsers.map((o) => ({
      id: o._id.toString(),
      email: o.email,
      role: o.role,
      projects: o.projects
        .filter((p) => isSameObjectId((p as Project).createdBy, o))
        .map((p) => p._id.toString()),
    }));

    const usersWithProjectSizes = await Promise.all(
      usersWithProjects.map(async (user) => {
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

    return {
      users: usersWithProjectSizes,
    };
  }

  private async _getProjectSize(project: string) {
    const projectPath = this.pathService.getProjectDirectory(project);
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
