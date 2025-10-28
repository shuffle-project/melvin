import { ApiProperty, PickType } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Team } from 'src/modules/db/schemas/team.schema';

export class TeamEntity extends PickType(Team, [
  '_id',
  'name',
  'sizeLimit',
] as const) {
  // TODO why is that needed?
  @Exclude()
  __v: number;

  @ApiProperty()
  size: number;
}
