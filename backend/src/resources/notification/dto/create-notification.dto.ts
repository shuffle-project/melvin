import { PickType } from '@nestjs/swagger';
import { Notification } from '../../../modules/db/schemas/notification.schema';

export class CreateNotificationDto extends PickType(Notification, [
  'user',
  'activity',
] as const) {}
