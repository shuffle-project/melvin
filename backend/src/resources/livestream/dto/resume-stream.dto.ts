import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';
import { EXAMPLE_PROJECT } from '../../../constants/example.constants';

export class ResumeLivestreamDto {
  @ApiProperty({ example: EXAMPLE_PROJECT._id, required: true })
  @IsMongoId()
  projectId: string;
}
