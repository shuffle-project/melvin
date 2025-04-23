import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TiptapModule } from 'src/modules/tiptap/tiptap.module';
import { DbModule } from '../../modules/db/db.module';
import { LoggerModule } from '../../modules/logger/logger.module';
import { PathModule } from '../../modules/path/path.module';
import { PopulateController } from './populate.controller';
import { PopulateService } from './populate.service';

@Module({
  imports: [
    DbModule,
    LoggerModule,
    PathModule,
    ConfigModule,
    TiptapModule,
    BullModule.registerQueue(
      {
        name: 'project',
        defaultJobOptions: { removeOnComplete: true, removeOnFail: true },
      },
      {
        name: 'subtitles',
        defaultJobOptions: { removeOnComplete: true, removeOnFail: true },
      },
      {
        name: 'livestream',
        defaultJobOptions: { removeOnComplete: true, removeOnFail: true },
      },
    ),
  ],
  controllers: [PopulateController],
  providers: [PopulateService],
  exports: [PopulateService],
})
export class PopulateModule {}
