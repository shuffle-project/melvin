import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsJWT, IsString } from 'class-validator';

export class AuthVerifyEmailDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsEmail()
  email: string;
}

export class AuthVerifyEmailResponseDto {
  @ApiProperty()
  @IsJWT()
  token: string;
}
