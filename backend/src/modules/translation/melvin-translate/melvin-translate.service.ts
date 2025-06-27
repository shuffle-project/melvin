import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { LanguageShort } from 'src/app.interfaces';
import { WhisperConfig } from 'src/config/config.interface';
import { Project } from 'src/modules/db/schemas/project.schema';
import { CustomLogger } from 'src/modules/logger/logger.service';
import { MelvinAsrResultEntity } from 'src/modules/melvin-asr-api/melvin-asr-api.interfaces';
import { MelvinAsrApiService } from 'src/modules/melvin-asr-api/melvin-asr-api.service';
import { ProcessMelvinAsrJob } from 'src/processors/melvinAsr.processor';
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
      { repeat: { every: 10000 }, jobId: translate.id },
    );

    // return this._fetchResult(translate.id);
  }

  // copy from whisper speech service
  // TODO refactor to queue
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
      // TODO refactor in queue
      throw new Error('Internal Error in MelvinASR');
    }
    const words = this.melvinAsrApiService.toWords(transcriptEntity, false);
    return { words };
  }
}
