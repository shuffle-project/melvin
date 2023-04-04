import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomBadRequestException } from '../../utils/exceptions';
import { CustomLogger } from '../logger/logger.service';
import { Activity, ActivityDocument } from './schemas/activity.schema';
import { Caption, CaptionDocument } from './schemas/caption.schema';
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
    @InjectModel(Caption.name)
    public readonly captionModel: Model<CaptionDocument>,
    @InjectModel(Export.name)
    public readonly exportModel: Model<ExportDocument>,
    @InjectModel(Activity.name)
    public readonly activityModel: Model<ActivityDocument>,
    @InjectModel(Notification.name)
    public readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(Settings.name)
    public readonly settingsModel: Model<SettingsDocument>,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  async findProjectByIdOrThrow(id: string): Promise<LeanProjectDocument> {
    const project = await this.projectModel
      .findById(id)
      .populate('transcriptions')
      .populate('users')
      .lean()
      .exec();

    if (!project) {
      throw new CustomBadRequestException('unknown_project_id');
    }

    return project;
  }

  async findProjectByIdOrThrowAndPopulate(
    id: string,
    path: string,
  ): Promise<LeanProjectDocument> {
    const project = await this.projectModel
      .findById(id)
      .populate(path)
      .lean()
      .exec();

    if (!project) {
      throw new CustomBadRequestException('unknown_project_id');
    }

    return project;
  }
}
