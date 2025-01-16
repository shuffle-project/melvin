import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { PopulateModule } from '../../resources/populate/populate.module';
import { DbModule } from '../db/db.module';
import { LoggerModule } from '../logger/logger.module';
import { SpeechToTextModule } from '../speech-to-text/speech-to-text.module';
import { TiptapModule } from '../tiptap/tiptap.module';
import { MigrationService } from './migration.service';
import { FfmpegModule } from '../ffmpeg/ffmpeg.module';
import { PathService } from '../path/path.service';
import { PathModule } from '../path/path.module';

@Module({
  imports: [
    DbModule,
    PopulateModule,
    LoggerModule,
    TiptapModule,
    SpeechToTextModule,
    FfmpegModule,
    PathModule,
    BullModule.registerQueue({ name: 'subtitles' }, { name: 'video' }),
  ],
  providers: [MigrationService],
  exports: [MigrationService],
})
export class MigrationModule {}
