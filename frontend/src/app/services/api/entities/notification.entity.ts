import { ActivityEntity } from './activity.entity';

export interface NotificationEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  user: string;
  read: boolean;
  activity: ActivityEntity;
}
