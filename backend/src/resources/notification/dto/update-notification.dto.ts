import { PickType } from '@nestjs/swagger';
import { Notification } from '../../../modules/db/schemas/notification.schema';

export class UpdateNotificationDto extends PickType(Notification, [
  'read',
] as const) {}
