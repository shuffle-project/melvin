import { ApiProperty } from '@nestjs/swagger';
import { IsJWT } from 'class-validator';

export class AuthRefreshTokenDto {
  @ApiProperty()
  @IsJWT()
  token: string;
}

export class AuthRefreshTokenResponseDto {
  @ApiProperty()
  @IsJWT()
  token: string;
}
