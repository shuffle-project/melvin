import { Module } from '@nestjs/common';
import { LoggerModule } from '../logger/logger.module';
import { PathService } from './path.service';

@Module({
  imports: [LoggerModule],
  providers: [PathService],
  exports: [PathService],
})
export class PathModule {}
