import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsMongoId, IsOptional, Min } from 'class-validator';
import { EXAMPLE_PROJECT } from '../../../constants/example.constants';

export class FindAllActivitiesQuery {
  @ApiProperty({ example: EXAMPLE_PROJECT._id })
  @IsMongoId()
  projectId: string;

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
}
