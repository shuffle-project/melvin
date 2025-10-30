import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { MediaModule } from 'src/modules/media/media.module';
import { UploadModule } from 'src/modules/upload/upload.module';
import { DbModule } from '../../modules/db/db.module';
import { LoggerModule } from '../../modules/logger/logger.module';
import { PathModule } from '../../modules/path/path.module';
import { PermissionsModule } from '../../modules/permissions/permissions.module';
import { SubtitleFormatModule } from '../../modules/subtitle-format/subtitle-format.module';
import { TiptapModule } from '../../modules/tiptap/tiptap.module';
import { TranslationModule } from '../../modules/translation/translation.module';
import { EventsModule } from '../events/events.module';
import { TranscriptionController } from './transcription.controller';
import { TranscriptionService } from './transcription.service';

@Module({
  imports: [
    DbModule,
    EventsModule,
    PermissionsModule,
    SubtitleFormatModule,
    PathModule,
    BullModule.registerQueue({
      name: 'subtitles',
      defaultJobOptions: { removeOnComplete: true, removeOnFail: true },
    }),
    TranslationModule,
    LoggerModule,
    TiptapModule,
    MediaModule,
    UploadModule,
  ],
  controllers: [TranscriptionController],
  providers: [TranscriptionService],
  exports: [TranscriptionService],
})
export class TranscriptionModule {}
