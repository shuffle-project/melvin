import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';
import { EXAMPLE_PROJECT } from '../../../constants/example.constants';

export class FindAllTranscriptionsQuery {
  @ApiProperty({ example: EXAMPLE_PROJECT._id })
  @IsMongoId()
  projectId: string;
}
