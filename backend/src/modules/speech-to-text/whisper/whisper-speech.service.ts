import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosResponse } from 'axios';
import FormData from 'form-data';
import { readFile } from 'fs-extra';
import { catchError, lastValueFrom, map } from 'rxjs';
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
import { WhiTranscriptEntity } from './whisper.interfaces';

// npm rebuild bcrypt --build-from-source

@Injectable()
export class WhisperSpeechService implements ISpeechToTextService {
  private whisperConfig: WhisperConfig;

  private host: string;
  private apikey: string;

  constructor(
    private logger: CustomLogger,
    private pathService: PathService,
    private httpService: HttpService,
    private db: DbService,
    private configService: ConfigService,
    private melvinAsrApiService: MelvinAsrApiService,
  ) {
    this.logger.setContext(this.constructor.name);

    this.whisperConfig = this.configService.get<WhisperConfig>('whisper');

    this.host = this.whisperConfig.host;
    this.apikey = this.whisperConfig.apikey;
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
      console.log(error);
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

    console.log(melvinResultEntity);
    if (!melvinResultEntity.transcript) {
      // TODO
      throw new Error('TODO error');
    }

    const words = this.melvinAsrApiService.toWords(melvinResultEntity);
    return { words };

    // const transcribe = await this._transcribe(project, audio);

    // use cronJob/queue instead of
    // return await this._fetchResult(transcribe);
  }

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

    console.log(melvinResultEntity);
    if (!melvinResultEntity.transcript) {
      // TODO
      throw new Error('TODO error');
    }

    const words = this.melvinAsrApiService.toWords(melvinResultEntity);
    return { words };
  }

  private _getLanguage(languageString: string) {
    return languageString.includes('-')
      ? languageString.split('-')[0]
      : languageString;
  }

  async _getTranscript(transcriptId: string): Promise<WhiTranscriptEntity> {
    const response = await lastValueFrom(
      this.httpService
        .get<WhiTranscriptEntity>(
          `${this.host}/transcriptions/${transcriptId}`,
          {
            headers: {
              Authorization: this.apikey,
            },
          },
        )
        .pipe(
          map((res: AxiosResponse<WhiTranscriptEntity>) => {
            return res.data;
          }),
          catchError((error: AxiosError) => {
            if (error?.response?.status) {
              throw new HttpException(
                error.response.data,
                error.response.status,
              );
            } else {
              throw new HttpException('unknown error', 500);
            }
          }),
        ),
    );

    return response;
  }

  async _align(project: Project, text: string, language: string, audio: Audio) {
    const audioPath = this.pathService.getAudioFile(
      project._id.toString(),
      audio,
      false,
    );

    const file = await readFile(audioPath);

    const formData = new FormData();
    formData.append('file', file, audio._id.toString() + '.' + audio.extension);
    formData.append('task', 'align');
    formData.append('text', text);
    formData.append('language', language);
    // const settings: WhiTranscribeDto = {
    //   language: project.language,
    //   condition_on_previous_text: false,
    // };
    // formData.append('settings', JSON.stringify(settings));

    const response = await lastValueFrom(
      this.httpService
        .post<WhiTranscriptEntity>(`${this.host}/transcriptions`, formData, {
          headers: {
            // authorization: this.apikey,
            // 'Transfer-Encoding': 'chunked',
            Authorization: this.apikey,
            'Content-Type': 'multipart/form-data',
            ...formData.getHeaders(),
          },
        })
        .pipe(
          map((res: AxiosResponse<WhiTranscriptEntity>) => {
            return res.data;
          }),
          catchError((error: AxiosError) => {
            if (error?.response?.status) {
              throw new HttpException(
                error.response.data,
                error.response.status,
              );
            } else {
              throw new HttpException('unknown error', 500);
            }
          }),
        ),
    );

    return response;
  }
}
