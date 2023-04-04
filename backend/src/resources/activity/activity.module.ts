import { Module } from '@nestjs/common';
import { DbModule } from '../../modules/db/db.module';
import { PermissionsModule } from '../../modules/permissions/permissions.module';
import { NotificationModule } from '../notification/notification.module';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';

@Module({
  providers: [ActivityService],
  imports: [DbModule, PermissionsModule, NotificationModule],
  exports: [ActivityService],
  controllers: [ActivityController],
})
export class ActivityModule {}
