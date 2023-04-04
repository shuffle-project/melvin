import { ActivityEntity } from './activity.entity';

export interface ActivityListEntity {
  activities: ActivityEntity[];
  total: number;
  page: number;
  count: number;
}
