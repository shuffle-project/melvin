import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigEntity, Hello } from './app.interfaces';
import { Environment, Registration } from './config/config.interface';
import { LANGUAGES } from './constants/languages.constants';
import { MailService } from './modules/mail/mail.service';
import { SpeechToTextService } from './modules/speech-to-text/speech-to-text.service';
import { TranslationService } from './modules/translation/translation.service';

@Injectable()
export class AppService {
  constructor(
    private configService: ConfigService,
    private translationService: TranslationService,
    private speechToTextService: SpeechToTextService,
    private mailService: MailService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await Promise.all([
      await this.translationService.initServices(),
      await this.speechToTextService.initServices(),
    ]);
  }

  getHello(): Hello {
    return {
      environment: this.configService.get<Environment>('environment'),
    };
  }

  async getConfig(): Promise<ConfigEntity> {
    const registrationConfig =
      this.configService.get<Registration>('registration');

    const translationServices = this.translationService.getConfig();
    const asrServices = this.speechToTextService.getConfig();

    const languages = LANGUAGES;
    return {
      translationServices,
      asrServices,
      languages,
      registrationMode: registrationConfig.mode,
    };
  }
}
