import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { FfmpegModule } from '../ffmpeg/ffmpeg.module';
import { LoggerModule } from '../logger/logger.module';
import { PathModule } from '../path/path.module';
import { SpeechToTextModule } from '../speech-to-text/speech-to-text.module';
import { TiptapModule } from '../tiptap/tiptap.module';
import { MigrationService } from './migration.service';

@Module({
  imports: [
    DbModule,
    LoggerModule,
    TiptapModule,
    SpeechToTextModule,
    FfmpegModule,
    PathModule,
    BullModule.registerQueue(
      {
        name: 'subtitles',
        defaultJobOptions: { removeOnComplete: true, removeOnFail: true },
      },
      {
        name: 'video',
        defaultJobOptions: { removeOnComplete: true, removeOnFail: true },
      },
    ),
  ],
  providers: [MigrationService],
  exports: [MigrationService],
})
export class MigrationModule {}
