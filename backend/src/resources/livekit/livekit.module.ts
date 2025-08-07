import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from 'src/modules/db/db.module';
import { LivekitController } from './livekit.controller';
import { LivekitService } from './livekit.service';

@Module({
  imports: [ConfigModule, DbModule],
  controllers: [LivekitController],
  providers: [LivekitService],
})
export class LivekitModule {}
