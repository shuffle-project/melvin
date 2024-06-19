import { Module } from '@nestjs/common';
import { DbModule } from '../../modules/db/db.module';
import { LoggerModule } from '../../modules/logger/logger.module';
import { AuthModule } from '../auth/auth.module';
import { EventsGateway } from './events.gateway';
import { SocketService } from './socket.service';

@Module({
  imports: [AuthModule, LoggerModule, DbModule],
  providers: [EventsGateway, SocketService],
  exports: [EventsGateway],
})
export class EventsModule {}
