import { Module } from '@nestjs/common';
import { LoggerModule } from '../logger/logger.module';
import { PathModule } from '../path/path.module';
import { TasksService } from './tasks.service';

@Module({
  providers: [TasksService],
  imports: [LoggerModule, PathModule],
  exports: [TasksService],
})
export class TasksModule {}
