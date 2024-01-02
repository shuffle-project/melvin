import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    BullModule.registerQueue(
      { name: 'project' },
      { name: 'subtitles' },
      { name: 'livestream' },
    ),
  ],
  controllers: [PopulateController],
  providers: [PopulateService],
  exports: [PopulateService],
})
export class PopulateModule {}
