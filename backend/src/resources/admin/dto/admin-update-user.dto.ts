import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { AdminCreateUserDto } from './admin-create-user.dto';

export class AdminUpdateUserDto extends PartialType(AdminCreateUserDto) {
  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isEmailVerified?: boolean;
}
