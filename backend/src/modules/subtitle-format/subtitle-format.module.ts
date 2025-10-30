import { Module } from '@nestjs/common';
import { PathModule } from '../path/path.module';
import { TiptapModule } from '../tiptap/tiptap.module';
import { ExportSubtitlesService } from './export-subtitles.service';
import { ImportSubtitlesService } from './import-subtitles.service';

@Module({
  imports: [PathModule, TiptapModule],
  controllers: [],
  providers: [ExportSubtitlesService, ImportSubtitlesService],
  exports: [ExportSubtitlesService, ImportSubtitlesService],
})
export class SubtitleFormatModule {}
