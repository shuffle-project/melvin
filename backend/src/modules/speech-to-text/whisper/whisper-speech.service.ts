import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosResponse } from 'axios';
import FormData from 'form-data';
import { readFile } from 'fs-extra';
import { catchError, lastValueFrom, map } from 'rxjs';
import { LanguageShort } from '../../../app.interfaces';
import { WhisperConfig } from '../../../config/config.interface';
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
  WhiInformation,
  WhiTranscribeDto,
  WhiTranscriptEntity,
} from './whisper.interfaces';

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
      const response = await lastValueFrom(
        this.httpService
          .get<WhiInformation>(`${this.host}`, {
            headers: {
              Authorization: this.apikey,
            },
          })
          .pipe(
            map((res: AxiosResponse<WhiInformation>) => {
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

      return response.supported_language_codes.map((lang) => ({
        code: lang,
        name: lang,
      }));
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async run(project: Project, audio: Audio): Promise<TranscriptEntity> {
    const transcribe = await this._transcribe(project, audio);

    // use cronJob/queue instead of
    return await this._fetchResult(transcribe);
  }

  async runAlign(project: Project, text: string, audio: Audio) {
    const language = this._getLanguage(project.language);
    const align = await this._align(project, text, language, audio);

    return await this._fetchResult(align);
  }

  private _getLanguage(languageString: string) {
    return languageString.includes('-')
      ? languageString.split('-')[0]
      : languageString;
  }

  private async _fetchResult(transcribe: WhiTranscriptEntity) {
    const transcriptEntity: WhiTranscriptEntity = await new Promise(
      (resolve) => {
        const interval = setInterval(async () => {
          const transcriptEntityTemp = await this._getTranscript(
            transcribe.transcription_id,
          );
          if (
            transcriptEntityTemp.status === 'done' ||
            transcriptEntityTemp.status === 'finished' ||
            transcriptEntityTemp.status === 'error'
          ) {
            clearInterval(interval);
            resolve(transcriptEntityTemp);
          }
        }, 10000);
      },
    );

    if (transcriptEntity.status === 'error') {
      throw new Error(transcriptEntity.error_message);
    }

    // let currentMS = 0;
    const words: WordEntity[] = [];

    let lastSegmentEnd = 0;
    transcriptEntity.transcript.segments.forEach((segment) => {
      const secondsToLastSegment = segment.start - lastSegmentEnd;

      lastSegmentEnd = segment.end;

      segment.words.forEach((word, i) => {
        const startParagraph = i === 0 && secondsToLastSegment > 3;
        words.push({
          text: word.text,
          start: word.start * 1000,
          end: word.end * 1000,
          confidence: word.probability,
          startParagraph,
          speakerId: null,
        });
      });
    });

    return { words };
  }

  async _transcribe(project: Project, audio: Audio) {
    const audioPath = this.pathService.getAudioFile(
      project._id.toString(),
      audio,
    );

    const file = await readFile(audioPath);

    const formData = new FormData();
    formData.append('file', file, audio._id.toString() + '.' + audio.extension);
    const settings: WhiTranscribeDto = {
      language: this._getLanguage(project.language),
      condition_on_previous_text: false,
    };
    formData.append('settings', JSON.stringify(settings));

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
