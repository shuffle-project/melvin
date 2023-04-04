import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEmail } from 'class-validator';
import { EXAMPLE_USER } from '../../../constants/example.constants';

export class InviteDto {
  @ApiProperty({ type: [String], example: [EXAMPLE_USER.email] })
  @IsEmail({}, { each: true })
  @IsArray()
  @Type(() => Array)
  emails: string[];
}
