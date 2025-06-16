import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MelvinAsrAlignByAudioDto,
  MelvinAsrJobEntity,
  MelvinAsrResultEntity,
  MelvinAsrTranscript,
} from 'src/modules/melvin-asr-api/melvin-asr-api.interfaces';
import { MelvinAsrApiService } from 'src/modules/melvin-asr-api/melvin-asr-api.service';
import { LanguageShort } from '../../../app.interfaces';
import { WhisperConfig } from '../../../config/config.interface';
import { DbService } from '../../db/db.service';
import { Audio, Project } from '../../db/schemas/project.schema';
import { CustomLogger } from '../../logger/logger.service';
import { PathService } from '../../path/path.service';
import {
  ISpeechToTextService,
  TranscriptEntity,
} from '../speech-to-text.interfaces';

// npm rebuild bcrypt --build-from-source

@Injectable()
export class WhisperSpeechService implements ISpeechToTextService {
  private whisperConfig: WhisperConfig;

  constructor(
    private logger: CustomLogger,
    private pathService: PathService,
    private db: DbService,
    private configService: ConfigService,
    private melvinAsrApiService: MelvinAsrApiService,
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

      return settings.transcription_languages.map((lang) => ({
        code: lang,
        name: lang,
      }));
    } catch (error) {
      this.logger.info('Could not fetch languages from whisper ');
      this.logger.info(error);
      return null;
    }
  }

  async run(project: Project, audio: Audio): Promise<TranscriptEntity> {
    const uploaded = await this.melvinAsrApiService.upload(project, audio);

    const started = await this.melvinAsrApiService.runTranscription({
      audio_filename: uploaded.filename,
      language: this._getLanguage(project.language),
    });

    const melvinResultEntity: MelvinAsrResultEntity = await this._fetchResult(
      started,
    );

    if (!melvinResultEntity.transcript) {
      throw new Error('Internal Error in MelvinASR');
    }

    const words = this.melvinAsrApiService.toWords(melvinResultEntity);
    return { words };
  }

  // TODO refactor to queue
  async _fetchResult(job: MelvinAsrJobEntity): Promise<MelvinAsrResultEntity> {
    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        const jobTemp = await this.melvinAsrApiService.getJob(job.id);
        if (jobTemp.status === 'completed' || jobTemp.status === 'failed') {
          clearInterval(interval);

          const jobResult = await this.melvinAsrApiService.getJobResult(job.id);
          resolve(jobResult);
        }
      }, 10000);
    });
  }

  // TODO refactor to queue
  async runAlign(
    project: Project,
    melvinAsrTranscript: MelvinAsrTranscript,
    audio: Audio,
  ) {
    const uploaded = await this.melvinAsrApiService.upload(project, audio);

    const language = this._getLanguage(project.language);
    const dto: MelvinAsrAlignByAudioDto = {
      method: 'by_audio',
      transcript: melvinAsrTranscript,
      language,
      audio_filename: uploaded.filename,
    };
    const started = await this.melvinAsrApiService.runAlignment(dto);

    const melvinResultEntity = await this._fetchResult(started);

    if (!melvinResultEntity.transcript) {
      throw new Error('Internal Error in MelvinASR');
    }

    const words = this.melvinAsrApiService.toWords(melvinResultEntity);
    return { words };
  }

  private _getLanguage(languageString: string) {
    return languageString.includes('-')
      ? languageString.split('-')[0]
      : languageString;
  }
}
