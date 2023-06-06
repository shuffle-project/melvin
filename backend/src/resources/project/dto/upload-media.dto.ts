import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UploadMediaDto {
  @ApiProperty({ type: String, required: true, example: 'Speaker' })
  @IsString()
  title: string;
}
