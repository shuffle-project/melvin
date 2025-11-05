import { Module } from '@nestjs/common';
import { LoggerModule } from '../logger/logger.module';
import { PathModule } from '../path/path.module';
import { TiptapModule } from '../tiptap/tiptap.module';
import { ExportSubtitlesService } from './export-subtitles.service';
import { ImportSubtitlesService } from './import-subtitles.service';

@Module({
  imports: [PathModule, TiptapModule, LoggerModule],
  controllers: [],
  providers: [ExportSubtitlesService, ImportSubtitlesService],
  exports: [ExportSubtitlesService, ImportSubtitlesService],
})
export class SubtitleFormatModule {}
