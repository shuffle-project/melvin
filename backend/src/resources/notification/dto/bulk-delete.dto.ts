import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsMongoId } from 'class-validator';
import { EXAMPLE_NOTIFICATION } from '../../../constants/example.constants';

export class BulkRemoveDto {
  @ApiProperty({ example: [EXAMPLE_NOTIFICATION._id] })
  @IsArray()
  @IsMongoId({ each: true })
  @Type(() => Array)
  notificationIds: string[];
}
