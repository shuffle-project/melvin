import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from 'src/modules/db/db.module';
import { UserModule } from '../user/user.module';
import { LivekitController } from './livekit.controller';
import { LivekitService } from './livekit.service';

@Module({
  imports: [ConfigModule, DbModule, UserModule],
  controllers: [LivekitController],
  providers: [LivekitService],
})
export class LivekitModule {}
