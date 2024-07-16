import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { HocuspocusService } from './hocuspocus.service';
import { TiptapService } from './tiptap.service';

@Module({
  imports: [DbModule],
  providers: [HocuspocusService, TiptapService],
  exports: [HocuspocusService, TiptapService],
})
export class TiptapModule {}
