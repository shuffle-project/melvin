import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { LoggerModule } from '../logger/logger.module';
import { PathModule } from '../path/path.module';
import { MelvinAsrApiService } from './melvin-asr-api.service';

@Module({
  imports: [LoggerModule, PathModule, HttpModule, DbModule],
  providers: [MelvinAsrApiService],
  exports: [MelvinAsrApiService],
})
export class MelvinAsrApiModule {}
