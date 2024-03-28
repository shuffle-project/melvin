import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AuthViewerLoginDto {
  @ApiProperty()
  @IsString()
  viewerToken: string;
}
