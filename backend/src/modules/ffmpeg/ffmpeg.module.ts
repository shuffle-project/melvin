import { Module } from '@nestjs/common';
import { LoggerModule } from '../logger/logger.module';
import { PathModule } from '../path/path.module';
import { FfmpegService } from './ffmpeg.service';
import { DbService } from '../db/db.service';
import { DbModule } from '../db/db.module';

@Module({
  imports: [LoggerModule, PathModule, DbModule],
  providers: [FfmpegService],
  exports: [FfmpegService],
})
export class FfmpegModule {}
