import { ApiProperty, OmitType, PickType } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { PopulatedDoc } from 'mongoose';
import { Activity } from '../../../modules/db/schemas/activity.schema';
import { Project } from '../../../modules/db/schemas/project.schema';
import { User } from '../../../modules/db/schemas/user.schema';

@Exclude()
export class ActivityProjectEntity extends PickType(Project, [
  '_id',
  'title',
] as const) {
  @Expose()
  title: string;
}

@Exclude()
export class ActivityUserEntity extends PickType(User, [
  '_id',
  'name',
] as const) {
  @Expose()
  name: string;
}

export class ActivityEntity extends OmitType(Activity, [
  'project',
  'createdBy',
]) {
  @ApiProperty({ type: [ActivityProjectEntity] })
  @Type(() => ActivityProjectEntity)
  project: PopulatedDoc<Project>[];

  @ApiProperty({ type: ActivityUserEntity })
  @Type(() => ActivityUserEntity)
  createdBy: PopulatedDoc<User>;
}
