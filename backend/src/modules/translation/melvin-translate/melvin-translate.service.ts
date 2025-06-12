import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LanguageShort } from 'src/app.interfaces';
import { WhisperConfig } from 'src/config/config.interface';
import { CustomLogger } from 'src/modules/logger/logger.service';
import { MelvinAsrResultEntity } from 'src/modules/melvin-asr-api/melvin-asr-api.interfaces';
import { MelvinAsrApiService } from 'src/modules/melvin-asr-api/melvin-asr-api.service';
import { MelvinTranslateDto } from './melvin-translate.interfaces';

@Injectable()
export class MelvinTranslateService {
  private whisperConfig: WhisperConfig;

  constructor(
    private configService: ConfigService,
    private melvinAsrApiService: MelvinAsrApiService,
    private logger: CustomLogger,
  ) {
    this.logger.setContext(this.constructor.name);
    this.whisperConfig = this.configService.get<WhisperConfig>('whisper');
  }

  async fetchLanguages(): Promise<LanguageShort[]> {
    if (!this.whisperConfig) {
      return null;
    }
    try {
      const settings = await this.melvinAsrApiService.getSettings();

      const res = settings.translation_languages.map((lang) => ({
        code: lang,
        name: lang,
      }));
      return res;
    } catch (error) {
      this.logger.info('Could not fetch languages from whisper ');
      this.logger.info(error);
      return null;
    }

    return [];
  }

  async run(melvinTranslateDto: MelvinTranslateDto) {
    const translate = await this._translate(melvinTranslateDto);
    return this._fetchResult(translate.id);
  }

  async _translate(melvinTranslateDto: MelvinTranslateDto) {
    return this.melvinAsrApiService.runTranslation({
      source_language: melvinTranslateDto.language,
      ...melvinTranslateDto,
    });
  }

  // copy from whisper speech service
  private async _fetchResult(id: string) {
    const transcriptEntity: MelvinAsrResultEntity | null = await new Promise(
      (resolve) => {
        const interval = setInterval(async () => {
          const job = await this.melvinAsrApiService.getJob(id);
          if (job.status === 'completed' || job.status === 'failed') {
            clearInterval(interval);
            if (job.status === 'failed') {
              resolve(null);
            } else {
              const result = await this.melvinAsrApiService.getJobResult(id);
              resolve(result);
            }
          }
        }, 10000);
      },
    );
    if (!transcriptEntity) {
      // TODO
      throw new Error('TODO');
    }

    const words = this.melvinAsrApiService.toWords(transcriptEntity);
    return { words };
  }
}
