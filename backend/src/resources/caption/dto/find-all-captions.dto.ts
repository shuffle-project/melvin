import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsMongoId, IsOptional, Min } from 'class-validator';
import { EXAMPLE_TRANSCRIPTION } from '../../../constants/example.constants';

export class FindAllCaptionsQuery {
  @ApiProperty({ example: EXAMPLE_TRANSCRIPTION._id })
  @IsMongoId()
  transcriptionId: string;

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
