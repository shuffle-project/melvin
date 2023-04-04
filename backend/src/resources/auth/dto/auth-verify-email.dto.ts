import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsString } from 'class-validator';

export class AuthVerifyEmailDto {
  @ApiProperty()
  @IsString()
  verificationToken: string;
}

export class AuthVerifyEmailResponseDto {
  @ApiProperty()
  @IsJWT()
  token: string;
}
