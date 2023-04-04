import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsJWT, IsString } from 'class-validator';
import { EXAMPLE_USER } from '../../../constants/example.constants';

export class AuthLoginDto {
  @ApiProperty({ example: EXAMPLE_USER.email })
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;
}

export class AuthLoginResponseDto {
  @ApiProperty()
  @IsJWT()
  token: string;
}
