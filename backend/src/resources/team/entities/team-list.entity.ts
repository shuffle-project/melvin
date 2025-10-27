import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TeamEntity } from './team.entity';

export class TeamListEntity {
  @ApiProperty({ type: [TeamEntity] })
  @Type(() => TeamEntity)
  teams: TeamEntity[];
}
