import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TeamEntity } from 'src/resources/team/entities/team.entity';
import { UserRole } from 'src/resources/user/user.interfaces';

export class UserEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  role: UserRole;

  @ApiProperty()
  isEmailVerified: boolean;

  @ApiProperty()
  sizeInByte: number;

  @ApiProperty()
  accumulatedDuration: number;

  @ApiProperty()
  projectCount: number;

  @ApiProperty()
  sizeLimit: number | null;

  @ApiProperty()
  team: TeamEntity | null;
}

export class UserListEntity {
  @ApiProperty()
  @Type(() => UserEntity)
  users: UserEntity[];
}
