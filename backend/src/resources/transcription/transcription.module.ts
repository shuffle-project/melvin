import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { DbModule } from '../../modules/db/db.module';
import { LoggerModule } from '../../modules/logger/logger.module';
import { PathModule } from '../../modules/path/path.module';
import { PermissionsModule } from '../../modules/permissions/permissions.module';
import { SubtitleFormatModule } from '../../modules/subtitle-format/subtitle-format.module';
import { TranslationModule } from '../../modules/translation/translation.module';
import { CaptionModule } from '../caption/caption.module';
import { EventsModule } from '../events/events.module';
import { HocuspocusService } from './fulltext/hocuspocus.service';
import { TiptapService } from './fulltext/tiptap.service';
import { TranscriptionGateway } from './fulltext/transcription.gateway';
import { TranscriptionController } from './transcription.controller';
import { TranscriptionService } from './transcription.service';

@Module({
  imports: [
    DbModule,
    EventsModule,
    PermissionsModule,
    SubtitleFormatModule,
    CaptionModule,
    PathModule,
    BullModule.registerQueue({ name: 'subtitles' }),
    TranslationModule,
    LoggerModule,
  ],
  controllers: [TranscriptionController],
  providers: [
    TranscriptionService,
    TiptapService,
    TranscriptionGateway,
    HocuspocusService,
  ],
  exports: [TranscriptionService],
})
export class TranscriptionModule {}
