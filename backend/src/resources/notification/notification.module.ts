import { Module } from '@nestjs/common';
import { DbModule } from '../../modules/db/db.module';
import { EventsModule } from '../events/events.module';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
  controllers: [NotificationController],
  imports: [DbModule, EventsModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
