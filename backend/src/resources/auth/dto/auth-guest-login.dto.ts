import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsOptional, IsString } from 'class-validator';
import { EXAMPLE_USER } from '../../../constants/example.constants';

export class AuthGuestLoginDto {
  @ApiProperty()
  @IsString()
  inviteToken: string;

  @ApiProperty({ example: EXAMPLE_USER.name })
  @IsString()
  @IsOptional()
  name: string;
}

export class AuthGuestLoginResponseDto {
  @ApiProperty()
  @IsJWT()
  token: string;
}
