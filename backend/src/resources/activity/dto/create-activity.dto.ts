import { PickType } from '@nestjs/swagger';
import { Activity } from '../../../modules/db/schemas/activity.schema';

export class CreateActivityDto extends PickType(Activity, [
  'createdBy',
  'project',
  'action',
  'details',
] as const) {}
