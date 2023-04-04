import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from '../logger/logger.module';
import { DbService } from './db.service';
import { Activity, ActivitySchema } from './schemas/activity.schema';
import { Caption, CaptionSchema } from './schemas/caption.schema';
import { Export, ExportSchema } from './schemas/export.schema';
import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';
import { Project, ProjectSchema } from './schemas/project.schema';
import { Settings, SettingsSchema } from './schemas/settings.schema';
import {
  Transcription,
  TranscriptionSchema,
} from './schemas/transcription.schema';
import { User, UserSchema } from './schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Transcription.name, schema: TranscriptionSchema },
      { name: Caption.name, schema: CaptionSchema },
      { name: Export.name, schema: ExportSchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Settings.name, schema: SettingsSchema },
    ]),
    LoggerModule,
  ],
  providers: [DbService],
  exports: [DbService],
})
export class DbModule {}
