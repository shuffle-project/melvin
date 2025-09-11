import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { DbService } from '../..//modules/db/db.service';
import { EmailConfig } from '../../config/config.interface';
import { LeanUserDocument } from '../../modules/db/schemas/user.schema';
import { PathService } from '../../modules/path/path.service';
import {
  CustomForbiddenException,
  CustomInternalServerException,
} from '../../utils/exceptions';
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

  async remove(authUser: AuthUser, dto: { password: string }): Promise<void> {
    const user = await this.db.userModel.findById(authUser.id).exec();

    const passwordMatch = await bcrypt.compare(
      dto.password,
      user.hashedPassword,
    );
    if (!passwordMatch) {
      throw new CustomForbiddenException('password_is_incorrect');
    }

    // remove all ownded projects of user
    await this.deleteUserById(authUser.id);
  }

  async deleteUserById(userId: string) {
    await this.db.projectModel.deleteMany({ createdBy: userId }).lean().exec();

    // leave all projects of user
    await this.db.projectModel.updateMany(
      { users: { $in: [userId] } },
      { $pull: { users: userId } },
    );

    // remove user
    await this.db.userModel.findOneAndDelete({ _id: userId }).lean().exec();
  }
}
