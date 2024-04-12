import { ApiProperty } from '@nestjs/swagger';
import { IsJWT } from 'class-validator';

export class ChangePasswordEntity {
  @ApiProperty()
  @IsJWT()
  token: string;
}
