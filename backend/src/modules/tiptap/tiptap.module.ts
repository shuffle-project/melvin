import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { LoggerModule } from '../logger/logger.module';
import { HocuspocusService } from './hocuspocus.service';
import { TiptapService } from './tiptap.service';

@Module({
  imports: [DbModule, LoggerModule],
  providers: [HocuspocusService, TiptapService],
  exports: [TiptapService],
})
export class TiptapModule {}
