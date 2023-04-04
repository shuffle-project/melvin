import { Module } from '@nestjs/common';
import { DbModule } from '../../modules/db/db.module';
import { LoggerModule } from '../../modules/logger/logger.module';
import { AuthModule } from '../auth/auth.module';
import { EventsGateway } from './events.gateway';

@Module({
  imports: [AuthModule, LoggerModule, DbModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
