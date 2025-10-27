import { PickType } from '@nestjs/swagger';
import { Team } from 'src/modules/db/schemas/team.schema';

export class CreateTeamDto extends PickType(Team, ['name', 'sizeLimit']) {}
