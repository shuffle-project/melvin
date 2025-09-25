import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserRole } from 'src/resources/user/user.interfaces';

export class ProjectInformation {
  @ApiProperty()
  id: string;

  @ApiProperty()
  mbOnDisc: number;
}

export class UserEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  role: UserRole;

  @ApiProperty()
  isEmailVerified: boolean;

  @ApiProperty()
  mbOnDisc: number;

  @ApiProperty()
  accumulatedDuration: number;

  @ApiProperty()
  projectCount: number;

  // @ApiProperty({ type: [ProjectInformation] })
  // @Type(() => ProjectInformation)
  // projects: ProjectInformation[];
}

export class UserListEntity {
  @ApiProperty()
  @Type(() => UserEntity)
  users: UserEntity[];
}
