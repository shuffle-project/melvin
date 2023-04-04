import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString } from 'class-validator';
import { EXAMPLE_PROJECT } from '../../../constants/example.constants';

export class ConnectLivestreamDto {
  @ApiProperty({ example: EXAMPLE_PROJECT._id, required: true })
  @IsMongoId()
  projectId: string;

  @ApiProperty({ required: true })
  @IsString()
  sdpOffer: string;
}
