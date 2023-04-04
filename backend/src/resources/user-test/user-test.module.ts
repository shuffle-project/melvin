import { Module } from '@nestjs/common';
import { DbModule } from '../../modules/db/db.module';
import { LoggerModule } from '../../modules/logger/logger.module';
import { PathModule } from '../../modules/path/path.module';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';
import { PopulateModule } from '../populate/populate.module';
import { ProjectModule } from '../project/project.module';
import { UserTestController } from './user-test.controller';
import { UserTestService } from './user-test.service';

@Module({
  imports: [
    PopulateModule,
    DbModule,
    EventsModule,
    LoggerModule,
    PathModule,
    AuthModule,
    ProjectModule,
  ],
  controllers: [UserTestController],
  providers: [UserTestService],
})
export class UserTestModule {}
