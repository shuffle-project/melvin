import { NotificationEntity } from 'src/app/services/api/entities/notification.entity';
import { ACTIVITY_ENTITY_MOCK } from './activity.mock';

export const NOTIFICATION_ENTITY_MOCK: NotificationEntity[] = [
  {
    id: '627918575f371e3925e9e22c',
    read: false,
    activity: ACTIVITY_ENTITY_MOCK,
    user: '627918565f371e3925e91afe',
    createdAt: '2022-05-09T13:34:15.503+00:00',
    updatedAt: '2022-05-09T13:34:15.503+00:00',
  },
];
