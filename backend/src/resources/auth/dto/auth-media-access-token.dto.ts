import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class AuthMediaAccessTokenDto {
  @ApiProperty()
  @IsMongoId()
  projectId: string;
}
