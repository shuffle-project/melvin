import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AuthModule } from '../../resources/auth/auth.module';
import { CaptionModule } from '../../resources/caption/caption.module';
import { DbModule } from '../db/db.module';
import { LoggerModule } from '../logger/logger.module';
import { DeepLService } from './deepl/deepl.service';
import { GoogleTranslateService } from './google-translate/google-translate.service';
import { LibreTranslateService } from './libre-translate/libre-translate.service';
import { TranslationService } from './translation.service';

@Module({
  imports: [
    LoggerModule,
    DbModule,
    CaptionModule,
    AuthModule,
    HttpModule.register({}),
  ],
  providers: [
    TranslationService,
    DeepLService,
    LibreTranslateService,
    GoogleTranslateService,
  ],
  exports: [TranslationService, DeepLService, LibreTranslateService],
})
export class TranslationModule {}
