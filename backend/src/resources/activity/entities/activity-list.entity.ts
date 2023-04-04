import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ActivityEntity } from './activity.entity';

export class ActivityListEntity {
  @ApiProperty({ type: [ActivityEntity] })
  @Type(() => ActivityEntity)
  public activities: ActivityEntity[];

  @ApiProperty()
  public total: number;

  @ApiProperty()
  public page: number;

  @ApiProperty()
  public count: number;
}
