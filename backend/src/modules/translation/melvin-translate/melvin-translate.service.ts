import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosResponse } from 'axios';
import { catchError, lastValueFrom, map } from 'rxjs';
import { LanguageShort } from 'src/app.interfaces';
import { WhisperConfig } from 'src/config/config.interface';
import { WordEntity } from 'src/modules/speech-to-text/speech-to-text.interfaces';
import {
  WhiInformation,
  WhiTranscriptEntity,
} from 'src/modules/speech-to-text/whisper/whisper.interfaces';
import { MelvinTranslateDto } from './melvin-translate.interfaces';

@Injectable()
export class MelvinTranslateService {
  private whisperConfig: WhisperConfig;

  private host: string;
  private apikey: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
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
              'Content-Type': 'application/json',
            },
          })
          .pipe(
            map((res: AxiosResponse<WhiInformation>) => {
              return res.data;
            }),
            catchError((error: AxiosError) => {
              if (error?.response?.status) {
                console.log(error.response.data);
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

      const res = response.supported_language_codes.map((lang) => ({
        code: lang,
        name: lang,
      }));
      return res;
    } catch (error) {
      console.log(error);
      return null;
    }

    return [];
  }

  async run(melvinTranslateDto: MelvinTranslateDto) {
    const translate = await this._translate(melvinTranslateDto);
    return this._fetchResult(translate.id);
  }

  async _translate(melvinTranslateDto: MelvinTranslateDto) {
    console.log(`${this.host}/translate`);
    console.log(melvinTranslateDto);
    console.log(JSON.stringify(melvinTranslateDto.transcript.segments));
    const response = await lastValueFrom(
      this.httpService
        .post<{ id: string }>(`${this.host}/translate`, melvinTranslateDto, {
          headers: {
            Authorization: this.apikey,
            'Content-Type': 'application/json',
          },
        })
        .pipe(
          map((res: AxiosResponse<{ id: string }>) => {
            return res.data;
          }),
          catchError((error: AxiosError) => {
            if (error?.response?.status) {
              console.log(error.response.data);
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

  // copy from whisper speech service
  private async _fetchResult(id: string) {
    console.log('_fetchResult');
    console.log(id);
    const transcriptEntity: WhiTranscriptEntity = await new Promise(
      (resolve) => {
        const interval = setInterval(async () => {
          const transcriptEntityTemp = await this._getTranscript(id);
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

  // copy from whisper-speech service
  async _getTranscript(transcriptId: string): Promise<WhiTranscriptEntity> {
    console.log('_getTranscript');
    console.log(transcriptId);
    const response = await lastValueFrom(
      this.httpService
        .get<WhiTranscriptEntity>(
          `${this.host}/transcriptions/${transcriptId}`,
          {
            headers: {
              Authorization: this.apikey,
              'Content-Type': 'application/json',
            },
          },
        )
        .pipe(
          map((res: AxiosResponse<WhiTranscriptEntity>) => {
            return res.data;
          }),
          catchError((error: AxiosError) => {
            if (error?.response?.status) {
              console.log(error.response.data);
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
