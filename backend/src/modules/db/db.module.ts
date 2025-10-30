import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from '../logger/logger.module';
import { DbService } from './db.service';
import { Activity, ActivitySchema } from './schemas/activity.schema';
import { Export, ExportSchema } from './schemas/export.schema';
import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';
import { Project, ProjectSchema } from './schemas/project.schema';
import { Settings, SettingsSchema } from './schemas/settings.schema';
import { Team, TeamSchema } from './schemas/team.schema';
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
      { name: Export.name, schema: ExportSchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Settings.name, schema: SettingsSchema },
      { name: Team.name, schema: TeamSchema },
    ]),
    LoggerModule,
  ],
  providers: [DbService],
  exports: [DbService],
})
export class DbModule {}
