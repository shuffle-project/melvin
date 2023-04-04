import { Module } from '@nestjs/common';
import { PopulateModule } from '../../resources/populate/populate.module';
import { DbModule } from '../db/db.module';
import { LoggerModule } from '../logger/logger.module';
import { MigrationService } from './migration.service';

@Module({
  imports: [DbModule, PopulateModule, LoggerModule],
  providers: [MigrationService],
  exports: [MigrationService],
})
export class MigrationModule {}
