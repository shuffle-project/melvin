import { Module } from '@nestjs/common';
import { DbModule } from 'src/modules/db/db.module';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';

@Module({
  imports: [DbModule],
  controllers: [TeamController],
  providers: [TeamService],
})
export class TeamModule {}
