import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsMongoId, IsOptional, Min } from 'class-validator';
import { EXAMPLE_USER } from '../../../constants/example.constants';

export class FindAllNotificationsQuery {
  @ApiProperty({ example: EXAMPLE_USER._id })
  @IsMongoId()
  userId: string;

  @ApiProperty({ required: false, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  read?: boolean;
}
