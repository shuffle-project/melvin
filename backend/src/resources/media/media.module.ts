import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { DbModule } from 'src/modules/db/db.module';
import { PermissionsModule } from 'src/modules/permissions/permissions.module';
import { LoggerModule } from 'src/modules/logger/logger.module';
import { PathModule } from 'src/modules/path/path.module';

@Module({
  providers: [MediaService],
  controllers: [MediaController],
  imports: [DbModule, PermissionsModule, LoggerModule, PathModule],
})
export class MediaModule {}
