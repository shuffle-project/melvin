import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from '../db/db.module';
import { PermissionsService } from './permissions.service';

@Module({
  imports: [DbModule, ConfigModule],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
