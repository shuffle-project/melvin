import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class FindAllUsersQuery {
  @ApiProperty()
  @IsString()
  search: string;
}
