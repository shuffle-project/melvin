import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsMongoId, IsNumber, IsOptional } from 'class-validator';
import { AdminCreateUserDto } from './admin-create-user.dto';

export class AdminUpdateUserDto extends PartialType(AdminCreateUserDto) {
  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isEmailVerified?: boolean;

  @ApiProperty()
  @IsMongoId()
  @IsOptional()
  team?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  sizeLimit?: number | null;
}
