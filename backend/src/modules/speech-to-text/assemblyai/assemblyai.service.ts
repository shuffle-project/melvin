import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosResponse } from 'axios';
import { readFile } from 'fs-extra';
import { catchError, lastValueFrom, map } from 'rxjs';
import { LanguageShort } from '../../../app.interfaces';
import { AssmeblyAiConfig } from '../../../config/config.interface';
import { ProjectEntity } from '../../../resources/project/entities/project.entity';
import { DbService } from '../../db/db.service';
import { Audio, Project } from '../../db/schemas/project.schema';
import { CustomLogger } from '../../logger/logger.service';
import { PathService } from '../../path/path.service';
import {
  ISpeechToTextService,
  TranscriptEntity,
  WordEntity,
} from '../speech-to-text.interfaces';
import {
  AaTranscriptDto,
  AaTranscriptEntity,
  AaUploadEntity,
} from './assemblyai.interfaces';
@Injectable()
export class AssemblyAiService implements ISpeechToTextService {
  private assemblyAiConfig: AssmeblyAiConfig;

  private url: string;
  private apikey: string;

  constructor(
    private logger: CustomLogger,
    private pathService: PathService,
    private httpService: HttpService,
    private db: DbService,
    private configService: ConfigService,
  ) {
    this.logger.setContext(this.constructor.name);
    this.assemblyAiConfig =
      this.configService.get<AssmeblyAiConfig>('assemblyAi');

    this.url = this.assemblyAiConfig?.url;
    this.apikey = this.assemblyAiConfig?.apikey;
  }
  runAlign(project: ProjectEntity, text: string, audio: Audio): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async fetchLanguages(): Promise<LanguageShort[] | null> {
    if (!this.assemblyAiConfig) {
      return null;
    }

    const data: AaTranscriptDto = {
      audio_url: 'this-is-not-audio',
      language_code: 'this-is-no-valid-language-code',
    };

    let errormessage = '';
    try {
      await lastValueFrom(
        this.httpService
          .post(`${this.url}/transcript`, data, {
            headers: { authorization: this.apikey },
          })
          .pipe(
            catchError((error: AxiosError) => {
              errormessage = (error.response.data as any).error.toString();
              return '';
            }),
          ),
      );
    } catch (error) {}
    if (errormessage.startsWith('language_code must be one of')) {
      const languages = errormessage
        .toString()
        .replace('language_code must be one of ', '')
        .replace('.', '')
        .split(', ')
        .map((code) => ({ code, name: code }));

      return languages;
    }

    return null;
  }

  async run(project: Project, audio: Audio): Promise<TranscriptEntity> {
    const targetLang = project.language.substring(0, 2);

    const uploadEntity = await this._upload(project);

    const transcribe = await this._transcribe(
      uploadEntity.upload_url,
      targetLang,
    );

    // use cronJob/queue instead of
    const transcriptEntity: AaTranscriptEntity = await new Promise(
      (resolve) => {
        const interval = setInterval(async () => {
          const transcriptEntityTemp = await this._getTranscript(transcribe.id);
          if (
            transcriptEntityTemp.status === 'completed' ||
            transcriptEntityTemp.status === 'error'
          ) {
            clearInterval(interval);
            resolve(transcriptEntityTemp);
          }
        }, 10000);
      },
    );

    if (transcriptEntity.status === 'error') {
      throw new Error(transcriptEntity.error);
    }

    const words: WordEntity[] = transcriptEntity.words.map((w) => ({
      text: w.text,
      start: w.start,
      end: w.end,
      startParagraph: false,
      speakerId: null,
    }));

    return {
      words: words,
    };
  }

  async _upload(project: Project) {
    // const videoPath = this.pathService.getVideoFile(projectId);

    const mp4 = project.audios.find((audio) => audio.extension === 'mp4');
    const videoPath = this.pathService.getMediaFile(
      project._id.toString(),
      mp4,
    );

    const file = await readFile(videoPath);

    const response = await lastValueFrom(
      this.httpService
        .post<AaUploadEntity>(`${this.url}/upload`, file, {
          headers: {
            authorization: this.apikey,
            'Transfer-Encoding': 'chunked',
            'Content-Type': 'video/mp4',
          },
        })
        .pipe(
          map((res: AxiosResponse<AaUploadEntity>) => res.data),
          catchError((error: AxiosError) => {
            throw new HttpException(error.response.data, error.response.status);
          }),
        ),
    );

    return response;
  }

  async _transcribe(audioUrl: string, languageCode: string) {
    const data: AaTranscriptDto = {
      audio_url: audioUrl,
      language_code: languageCode,
    };

    const response = await lastValueFrom(
      this.httpService
        .post<AaTranscriptEntity>(`${this.url}/transcript`, data, {
          headers: {
            authorization: this.apikey,
            'Content-Type': 'application/json',
          },
        })
        .pipe(
          map((res: AxiosResponse<AaTranscriptEntity>) => res.data),
          catchError((error: AxiosError) => {
            throw new HttpException(error.response.data, error.response.status);
          }),
        ),
    );

    return response;
  }

  async _getTranscript(transcriptId: string) {
    const response = await lastValueFrom(
      this.httpService
        .get<AaTranscriptEntity>(`${this.url}/transcript/${transcriptId}`, {
          headers: {
            authorization: this.apikey,
          },
        })
        .pipe(
          map((res: AxiosResponse<AaTranscriptEntity>) => res.data),
          catchError((error: AxiosError) => {
            throw new HttpException(error.response.data, error.response.status);
          }),
        ),
    );

    return response;
  }
}
