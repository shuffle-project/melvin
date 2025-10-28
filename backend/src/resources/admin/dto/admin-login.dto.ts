import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { EXAMPLE_USER } from 'src/constants/example.constants';

export class AdminLoginDto {
  @ApiProperty({ example: EXAMPLE_USER.name })
  @IsString()
  username: string;

  @ApiProperty()
  @IsString()
  password: string;
}
