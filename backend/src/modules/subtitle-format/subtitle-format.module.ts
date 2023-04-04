import { Module } from '@nestjs/common';
import { CaptionModule } from '../../resources/caption/caption.module';
import { PathModule } from '../path/path.module';
import { ExportSubtitlesService } from './export-subtitles.service';
import { ImportSubtitlesService } from './import-subtitles.service';

@Module({
  imports: [PathModule, CaptionModule],
  controllers: [],
  providers: [ExportSubtitlesService, ImportSubtitlesService],
  exports: [ExportSubtitlesService, ImportSubtitlesService],
})
export class SubtitleFormatModule {}
