import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import { CustomBadRequestException } from '../../utils/exceptions';
import { CustomLogger } from '../logger/logger.service';
import { Activity, ActivityDocument } from './schemas/activity.schema';
import { Export, ExportDocument } from './schemas/export.schema';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import {
  LeanProjectDocument,
  Project,
  ProjectDocument,
} from './schemas/project.schema';
import { Settings, SettingsDocument } from './schemas/settings.schema';
import { Team, TeamDocument } from './schemas/team.schema';
import {
  Transcription,
  TranscriptionDocument,
} from './schemas/transcription.schema';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class DbService {
  constructor(
    private logger: CustomLogger,
    @InjectModel(User.name)
    public readonly userModel: Model<UserDocument>,
    @InjectModel(Project.name)
    public readonly projectModel: Model<ProjectDocument>,
    @InjectModel(Transcription.name)
    public readonly transcriptionModel: Model<TranscriptionDocument>,
    @InjectModel(Export.name)
    public readonly exportModel: Model<ExportDocument>,
    @InjectModel(Activity.name)
    public readonly activityModel: Model<ActivityDocument>,
    @InjectModel(Notification.name)
    public readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(Settings.name)
    public readonly settingsModel: Model<SettingsDocument>,
    @InjectModel(Team.name)
    public readonly teamModel: Model<TeamDocument>,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  async findProjectByIdOrThrow(
    id: string | Types.ObjectId,
  ): Promise<LeanProjectDocument> {
    const project = await this.projectModel
      .findById(id)
      .populate('transcriptions')
      .populate('users')
      .populate('createdBy')
      .lean()
      .exec();

    if (!project) {
      throw new CustomBadRequestException('unknown_project_id');
    }

    return project;
  }

  /**
   * @returns return new object with correct populate path
   */
  async updateProjectByIdAndReturn(
    id: string | Types.ObjectId,
    update: UpdateQuery<Project>,
  ): Promise<LeanProjectDocument> {
    const updatedProject = await this.projectModel
      .findByIdAndUpdate(id, update, {
        new: true,
        populate: ['transcriptions', 'users', 'createdBy'],
      })
      .lean()
      .exec();

    return updatedProject;
  }

  async getUserSize(userId: string): Promise<number> {
    return this._getSizeByUserIDs([userId]);
  }
  async getTeamSize(teamId: string): Promise<number> {
    const team = await this.teamModel.findById(teamId).lean().exec();

    const docs = await this.userModel
      .find({ team: team._id }, { _id: 1 })
      .lean()
      .exec();
    const users = docs.map((doc) => doc._id.toString());
    return this._getSizeByUserIDs(users);
  }

  async _getSizeByUserIDs(userIds: string[]): Promise<number> {
    const users: Types.ObjectId[] = userIds.map((id) => new Types.ObjectId(id));

    const result = await this.projectModel.aggregate([
      { $match: { createdBy: { $in: users } } },

      // compute sum per-project
      {
        $project: {
          sizeVideo: { $sum: '$videos.sizeInBytes' },
          sizeAudio: { $sum: '$audios.sizeInBytes' },
        },
      },
      // sum across all projects
      {
        $group: {
          _id: null,
          totalSize: { $sum: { $add: ['$sizeVideo', '$sizeAudio'] } },
        },
      },
    ]);

    const size: number = result.length > 0 ? result[0]?.totalSize ?? 0 : 0;
    return size;
  }
}
