import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PopulatedDoc } from 'mongoose';
import { Activity } from '../../../modules/db/schemas/activity.schema';
import { Notification } from '../../../modules/db/schemas/notification.schema';
import { ActivityEntity } from '../../activity/entities/activity.entity';

export class NotificationEntity extends OmitType(Notification, ['activity']) {
  @ApiProperty({ type: [ActivityEntity] })
  @Type(() => ActivityEntity)
  activity: PopulatedDoc<Activity>[];
}
