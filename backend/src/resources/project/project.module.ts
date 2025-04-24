import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { MediaModule } from 'src/modules/media/media.module';
import { UploadModule } from 'src/modules/upload/upload.module';
import { DbModule } from '../../modules/db/db.module';
import { FfmpegModule } from '../../modules/ffmpeg/ffmpeg.module';
import { LoggerModule } from '../../modules/logger/logger.module';
import { MailModule } from '../../modules/mail/mail.module';
import { PathModule } from '../../modules/path/path.module';
import { PermissionsModule } from '../../modules/permissions/permissions.module';
import { SpeechToTextModule } from '../../modules/speech-to-text/speech-to-text.module';
import { SubtitleFormatModule } from '../../modules/subtitle-format/subtitle-format.module';
import { ActivityModule } from '../activity/activity.module';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';
import { PopulateModule } from '../populate/populate.module';
import { TranscriptionModule } from '../transcription/transcription.module';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

@Module({
  imports: [
    DbModule,
    EventsModule,
    PermissionsModule,
    MailModule,
    ActivityModule,
    LoggerModule,
    FfmpegModule,
    PathModule,
    TranscriptionModule,
    AuthModule,
    SubtitleFormatModule,
    SpeechToTextModule,
    PopulateModule,
    MediaModule,
    UploadModule,
    BullModule.registerQueue(
      {
        name: 'project',
        defaultJobOptions: { removeOnComplete: true, removeOnFail: true },
      },
      {
        name: 'subtitles',
        defaultJobOptions: { removeOnComplete: true, removeOnFail: true },
      },
      {
        name: 'livestream',
        defaultJobOptions: { removeOnComplete: true, removeOnFail: true },
      },
    ),
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
