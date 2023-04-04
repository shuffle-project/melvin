import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsMongoId, ValidateNested } from 'class-validator';
import { UpdateNotificationDto } from './update-notification.dto';

export class UpdateNotificationWithIdDto extends UpdateNotificationDto {
  @ApiProperty()
  @IsMongoId()
  @Type(() => String)
  @Expose()
  id: string;
}

export class UpdateManyNotificationsDto {
  @ApiProperty()
  @IsArray()
  @Type(() => Array)
  @ValidateNested({ each: true })
  notifications: UpdateNotificationWithIdDto[];
}
