import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { NotificationEntity } from './notification.entity';

export class NotificationListEntity {
  @ApiProperty({ type: [NotificationEntity] })
  @Type(() => NotificationEntity)
  public notifications: NotificationEntity[];

  @ApiProperty()
  public total: number;

  @ApiProperty()
  public page: number;

  @ApiProperty()
  public count: number;
}
