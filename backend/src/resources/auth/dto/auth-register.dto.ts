import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { EXAMPLE_USER } from '../../../constants/example.constants';

export class AuthRegisterDto {
  @ApiProperty({ example: EXAMPLE_USER.email })
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;

  @ApiProperty({ example: EXAMPLE_USER.name })
  @IsString()
  name: string;
}
