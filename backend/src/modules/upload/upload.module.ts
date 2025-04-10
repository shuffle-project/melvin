import { Module } from '@nestjs/common';
import { LoggerModule } from '../logger/logger.module';
import { PathModule } from '../path/path.module';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  providers: [UploadService],
  imports: [PathModule, LoggerModule],
  controllers: [UploadController],
  exports: [UploadService],
})
export class UploadModule {}
