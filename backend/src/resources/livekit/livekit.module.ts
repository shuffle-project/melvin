import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from 'src/modules/db/db.module';
import { FfmpegModule } from 'src/modules/ffmpeg/ffmpeg.module';
import { PathModule } from 'src/modules/path/path.module';
import { TiptapModule } from 'src/modules/tiptap/tiptap.module';
import { UserModule } from '../user/user.module';
import { LivekitController } from './livekit.controller';
import { LivekitService } from './livekit.service';

@Module({
  imports: [
    ConfigModule,
    DbModule,
    UserModule,
    TiptapModule,
    PathModule,
    BullModule.registerQueue({
      name: 'video',
      defaultJobOptions: { removeOnComplete: true, removeOnFail: true },
    }),
    FfmpegModule,
  ],
  controllers: [LivekitController],
  providers: [LivekitService],
})
export class LivekitModule {}
