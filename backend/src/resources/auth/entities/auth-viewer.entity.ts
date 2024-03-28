import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsString } from 'class-validator';

export class AuthViewerLoginResponseEntity {
  @ApiProperty()
  @IsJWT()
  token: string;

  @ApiProperty()
  @IsString()
  projectId: string;
}
