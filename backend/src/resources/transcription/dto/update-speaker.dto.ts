import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { EXAMPLE_SPEAKER } from '../../../constants/example.constants';

export class UpdateSpeakerDto {
  @ApiProperty({ example: EXAMPLE_SPEAKER.name })
  @IsString()
  name: string;
}
