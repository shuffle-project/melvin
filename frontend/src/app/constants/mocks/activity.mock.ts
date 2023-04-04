import { ActivityEntity } from 'src/app/services/api/entities/activity.entity';

export const ACTIVITY_ENTITY_MOCK: ActivityEntity = {
  action: 'video-processing-finished',
  createdAt: '2022-05-11T08:32:04.499Z',
  createdBy: { id: '627b7480e60a01db2f03c775', name: 'System' },
  id: '627b7484e60a01db2f04eb67',
  project: {
    id: '6200e98c9f6b0de828dbe34a',
    title: 'Dangerous superficial knowledge',
  },
  updatedAt: '2022-05-11T08:32:04.499Z',
};
