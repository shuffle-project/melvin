import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ResetPasswordByTokenDto {
  @ApiProperty()
  @IsString()
  password: string;
}
