import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { PopulateModule } from '../../resources/populate/populate.module';
import { DbModule } from '../db/db.module';
import { LoggerModule } from '../logger/logger.module';
import { SpeechToTextModule } from '../speech-to-text/speech-to-text.module';
import { TiptapModule } from '../tiptap/tiptap.module';
import { MigrationService } from './migration.service';

@Module({
  imports: [
    DbModule,
    PopulateModule,
    LoggerModule,
    TiptapModule,
    SpeechToTextModule,
    BullModule.registerQueue({ name: 'subtitles' }),
  ],
  providers: [MigrationService],
  exports: [MigrationService],
})
export class MigrationModule { }
