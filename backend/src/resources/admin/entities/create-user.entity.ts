import { Optional } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { PasswordResetMethod } from './reset-password.entity';
import { UserEntity } from './user-list.entity';

export class CreateUserEntity {
  @ApiProperty()
  method: PasswordResetMethod;

  @ApiProperty()
  @Optional()
  password?: string;

  @ApiProperty()
  user: UserEntity;
}
