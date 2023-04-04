import { Module } from '@nestjs/common';
import { DbModule } from '../../modules/db/db.module';
import { LoggerModule } from '../../modules/logger/logger.module';
import { PathModule } from '../../modules/path/path.module';
import { PermissionsModule } from '../../modules/permissions/permissions.module';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';
import { ProjectModule } from '../project/project.module';
import { LivestreamController } from './livestream.controller';
import { LivestreamService } from './livestream.service';

@Module({
  imports: [
    AuthModule,
    EventsModule,
    LoggerModule,
    DbModule,
    PermissionsModule,
    PathModule,
    ProjectModule,
  ],
  controllers: [LivestreamController],
  providers: [LivestreamService],
})
export class LivestreamModule {}
