import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { LoggerModule } from '../logger/logger.module';
import { PathModule } from '../path/path.module';
import { TasksService } from './tasks.service';

@Module({
  providers: [TasksService],
  imports: [LoggerModule, PathModule, DbModule],
  exports: [TasksService],
})
export class TasksModule {}
