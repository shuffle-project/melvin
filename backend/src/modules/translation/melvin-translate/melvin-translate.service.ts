import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { LanguageShort } from 'src/app.interfaces';
import { WhisperConfig } from 'src/config/config.interface';
import { Project } from 'src/modules/db/schemas/project.schema';
import { CustomLogger } from 'src/modules/logger/logger.service';
import { MelvinAsrApiService } from 'src/modules/melvin-asr-api/melvin-asr-api.service';
import { ProcessMelvinAsrJob } from 'src/processors/melvin-asr.processor';
import { TranscriptionEntity } from 'src/resources/transcription/entities/transcription.entity';
import { MelvinTranslateDto } from './melvin-translate.interfaces';

@Injectable()
export class MelvinTranslateService {
  private whisperConfig: WhisperConfig;

  constructor(
    private configService: ConfigService,
    private melvinAsrApiService: MelvinAsrApiService,
    private logger: CustomLogger,
    @InjectQueue('melvinAsr')
    private melvinAsrQueue: Queue<ProcessMelvinAsrJob>,
  ) {
    this.logger.setContext(this.constructor.name);
    this.whisperConfig = this.configService.get<WhisperConfig>('whisper');
  }

  async fetchLanguages(): Promise<LanguageShort[]> {
    if (!this.whisperConfig) {
      return null;
    }
    try {
      this.logger.info('Fetching languages from MelvinASR for translation');
      const settings = await this.melvinAsrApiService.getSettingsRetry();

      this.logger.info(
        'Fetched languages from MelvinASR for translation successfully',
      );
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

  async run(
    melvinTranslateDto: MelvinTranslateDto,
    project: Project,
    transcription: TranscriptionEntity,
    newSpeakerId?: string,
  ) {
    const translate = await this.melvinAsrApiService.runTranslation({
      source_language: melvinTranslateDto.language,
      ...melvinTranslateDto,
    });

    // Every and jobId need to be identical to the .removeRepeatable options
    await this.melvinAsrQueue.add(
      'fetchResult',
      {
        id: translate.id,
        transcription,
        project,
        newSpeakerId,
        paragraphsViaTime: false,
      },
      {
        attempts: 10,
        backoff: 10000,
      },
    );

    // return this._fetchResult(translate.id);
  }
}
