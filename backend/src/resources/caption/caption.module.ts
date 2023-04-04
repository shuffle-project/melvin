import { Module } from '@nestjs/common';
import { DbModule } from '../../modules/db/db.module';
import { PermissionsModule } from '../../modules/permissions/permissions.module';
import { EventsModule } from '../events/events.module';
import { CaptionController } from './caption.controller';
import { CaptionService } from './caption.service';

@Module({
  controllers: [CaptionController],
  imports: [DbModule, EventsModule, PermissionsModule],
  providers: [CaptionService],
  exports: [CaptionService],
})
export class CaptionModule {}
