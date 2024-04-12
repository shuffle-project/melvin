import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { EXAMPLE_USER } from '../../../constants/example.constants';

export class ChangePasswordDto {
  @ApiProperty({ example: EXAMPLE_USER.email })
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  oldPassword: string;

  @ApiProperty()
  @IsString()
  newPassword: string;
}
