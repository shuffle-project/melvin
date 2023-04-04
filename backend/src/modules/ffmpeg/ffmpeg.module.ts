import { Module } from '@nestjs/common';
import { LoggerModule } from '../logger/logger.module';
import { PathModule } from '../path/path.module';
import { FfmpegService } from './ffmpeg.service';

@Module({
  imports: [LoggerModule, PathModule],
  providers: [FfmpegService],
  exports: [FfmpegService],
})
export class FfmpegModule {}
