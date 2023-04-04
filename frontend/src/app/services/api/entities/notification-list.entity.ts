import { NotificationEntity } from './notification.entity';

export interface NotificationListEntity {
  notifications: NotificationEntity[];
  total: number;
  page: number;
}

export interface DateSortedNotifications {
  date: string;
  notifications: NotificationEntity[];
}
