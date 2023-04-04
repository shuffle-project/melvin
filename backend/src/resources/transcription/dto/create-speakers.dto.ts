import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import { EXAMPLE_SPEAKER } from '../../../constants/example.constants';

export class CreateSpeakersDto {
  @ApiProperty({ example: [EXAMPLE_SPEAKER.name] })
  @IsArray()
  names: string[];
}
