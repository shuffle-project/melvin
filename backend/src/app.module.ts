import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongodbConfig, RedisConfig } from './config/config.interface';
import { configuration } from './config/config.load';
import { DbModule } from './modules/db/db.module';
import { FfmpegModule } from './modules/ffmpeg/ffmpeg.module';
import { LoggerModule } from './modules/logger/logger.module';
import { MediaModule } from './modules/media/media.module';
import { MigrationModule } from './modules/migration/migration.module';
import { PathModule } from './modules/path/path.module';
import { SpeechToTextModule } from './modules/speech-to-text/speech-to-text.module';
import { SubtitleFormatModule } from './modules/subtitle-format/subtitle-format.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { TranslationModule } from './modules/translation/translation.module';
import { LivestreamProcessor } from './processors/livestream.processor';
import { ProjectProcessor } from './processors/project.processor';
import { SubtitlesProcessor } from './processors/subtitles.processor';
import { VideoProcessor } from './processors/video.processor';
import { ActivityModule } from './resources/activity/activity.module';
import { AuthModule } from './resources/auth/auth.module';
import { CaptionModule } from './resources/caption/caption.module';
import { EventsModule } from './resources/events/events.module';
import { NotificationModule } from './resources/notification/notification.module';
import { PopulateModule } from './resources/populate/populate.module';
import { ProjectModule } from './resources/project/project.module';
import { TranscriptionModule } from './resources/transcription/transcription.module';
import { UserModule } from './resources/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const { uri } = configService.get<MongodbConfig>('mongodb');
        return {
          uri,
        };
      },
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const config = configService.get<RedisConfig>('redis');
        return config
          ? { redis: { host: config.host, port: config.port } }
          : {};
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: 'project',
        defaultJobOptions: { removeOnComplete: true, removeOnFail: true },
      },
      {
        name: 'subtitles',
        defaultJobOptions: { removeOnComplete: true, removeOnFail: true },
      },
      {
        name: 'livestream',
        defaultJobOptions: { removeOnComplete: true, removeOnFail: true },
      },
      {
        name: 'video',
        defaultJobOptions: { removeOnComplete: true, removeOnFail: true },
      },
      {
        name: 'melvinASR',
        defaultJobOptions: { removeOnComplete: true, removeOnFail: false },
      },
    ),
    ScheduleModule.forRoot(),
    DbModule,
    LoggerModule,
    PopulateModule,
    MigrationModule,
    // Resources
    AuthModule,
    ProjectModule,
    UserModule,
    CaptionModule,
    TranscriptionModule,
    EventsModule,
    NotificationModule,
    FfmpegModule,
    PathModule,
    ActivityModule,
    MediaModule,
    TasksModule,
    // TODO LivestreamModule,
    // generate captions
    SpeechToTextModule,
    SubtitleFormatModule,
    TranslationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ProjectProcessor,
    SubtitlesProcessor,
    LivestreamProcessor,
    VideoProcessor,
  ],
})
export class AppModule {}
