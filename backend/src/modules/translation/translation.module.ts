import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { AuthModule } from '../../resources/auth/auth.module';
import { DbModule } from '../db/db.module';
import { LoggerModule } from '../logger/logger.module';
import { MelvinAsrApiModule } from '../melvin-asr-api/melvin-asr-api.module';
import { TiptapModule } from '../tiptap/tiptap.module';
import { MelvinTranslateService } from './melvin-translate/melvin-translate.service';
import { TranslationService } from './translation.service';

@Module({
  imports: [
    LoggerModule,
    DbModule,
    AuthModule,
    HttpModule.register({}),
    TiptapModule,
    MelvinAsrApiModule,
    BullModule.registerQueue({
      name: 'melvinAsr',
      defaultJobOptions: { removeOnComplete: true, removeOnFail: true },
    }),
  ],
  providers: [TranslationService, MelvinTranslateService],
  exports: [TranslationService],
})
export class TranslationModule {}
