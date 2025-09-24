import { Optional } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export enum PasswordResetMethod {
  EMAIL = 'email',
  RETURN = 'return',
}

export class ResetPasswordEntity {
  @ApiProperty()
  method: PasswordResetMethod;

  @ApiProperty()
  @Optional()
  password?: string;
}
