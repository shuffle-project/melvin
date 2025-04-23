import { Module } from '@nestjs/common';
import { DbModule } from 'src/modules/db/db.module';
import { LoggerModule } from 'src/modules/logger/logger.module';
import { PathModule } from 'src/modules/path/path.module';
import { PermissionsModule } from 'src/modules/permissions/permissions.module';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  providers: [MediaService],
  controllers: [MediaController],
  imports: [DbModule, PermissionsModule, LoggerModule, PathModule],
  exports: [MediaService],
})
export class MediaModule {}
