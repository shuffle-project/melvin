import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosResponse } from 'axios';
import FormData from 'form-data';
import { readFile } from 'fs-extra';
import { catchError, lastValueFrom, map, retry, timer } from 'rxjs';
import { MelvinAsrConfig } from 'src/config/config.interface';
import { DbService } from '../db/db.service';
import { Audio, Project } from '../db/schemas/project.schema';
import { CustomLogger } from '../logger/logger.service';
import { PathService } from '../path/path.service';
import { WordEntity } from '../speech-to-text/speech-to-text.interfaces';
import { WhiInformation } from '../speech-to-text/whisper/whisper.interfaces';
import {
  MelvinAsrAlignByAudioDto,
  MelvinAsrAlignByTimeDto,
  MelvinAsrAlignByTranscripDto,
  MelvinAsrJobEntity,
  MelvinAsrResultEntity,
  MelvinAsrTranscribeDto,
  MelvinAsrTranslateDto,
  MelvinAsrUploadEntity,
} from './melvin-asr-api.interfaces';

@Injectable()
export class MelvinAsrApiService {
  private whisperConfig: MelvinAsrConfig;

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

    this.whisperConfig = this.configService.get<MelvinAsrConfig>('melvinAsr');

    this.host = this.whisperConfig.host;
    this.apikey = this.whisperConfig.apikey;
  }

  async runTranscription(transcribeDto: MelvinAsrTranscribeDto) {
    return await lastValueFrom(
      this.httpService
        .post<MelvinAsrJobEntity>(
          `${this.host}/jobs/transcription`,
          transcribeDto,
          {
            headers: {
              Authorization: this.apikey,
            },
          },
        )
        .pipe(
          map((res: AxiosResponse<MelvinAsrJobEntity>) => {
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
  }

  async runTranslation(translationDto: MelvinAsrTranslateDto) {
    return await lastValueFrom(
      this.httpService
        .post<MelvinAsrJobEntity>(
          `${this.host}/jobs/translation`,
          translationDto,
          {
            headers: {
              Authorization: this.apikey,
              'Content-Type': 'application/json',
            },
          },
        )
        .pipe(
          map((res: AxiosResponse<MelvinAsrJobEntity>) => {
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
  }

  async runAlignment(
    alignDto:
      | MelvinAsrAlignByAudioDto
      | MelvinAsrAlignByTimeDto
      | MelvinAsrAlignByTranscripDto,
  ) {
    return await lastValueFrom(
      this.httpService
        .post<MelvinAsrJobEntity>(`${this.host}/jobs/alignment`, alignDto, {
          headers: {
            Authorization: this.apikey,
            'Content-Type': 'application/json',
          },
        })
        .pipe(
          map((res: AxiosResponse<MelvinAsrJobEntity>) => {
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
  }

  async getJobResult(job_id: string): Promise<MelvinAsrResultEntity> {
    return await lastValueFrom(
      this.httpService
        .get<MelvinAsrResultEntity>(`${this.host}/jobs/${job_id}/result`, {
          headers: {
            Authorization: this.apikey,
          },
        })
        .pipe(
          map((res: AxiosResponse<MelvinAsrResultEntity>) => {
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
  }

  async getJob(job_id: string): Promise<MelvinAsrJobEntity> {
    return await lastValueFrom(
      this.httpService
        .get<MelvinAsrJobEntity>(`${this.host}/jobs/${job_id}`, {
          headers: {
            Authorization: this.apikey,
          },
        })
        .pipe(
          map((res: AxiosResponse<MelvinAsrJobEntity>) => {
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
  }

  async getJobs(): Promise<MelvinAsrJobEntity[]> {
    return await lastValueFrom(
      this.httpService
        .get<MelvinAsrJobEntity[]>(`${this.host}/jobs`, {
          headers: {
            Authorization: this.apikey,
          },
        })
        .pipe(
          map((res: AxiosResponse<MelvinAsrJobEntity[]>) => {
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
  }

  async getSettingsRetry(): Promise<WhiInformation> {
    return await lastValueFrom(
      this.httpService
        .get<WhiInformation>(`${this.host}/settings`, {
          headers: {
            Authorization: this.apikey,
          },
        })
        .pipe(
          retry({
            count: 5,
            delay: (error, count) => {
              const delayTime = Math.min(60000, Math.pow(2, count) * 1000);
              this.logger.info(
                'error in fetching settings from MelvinASR, retry in ' +
                  delayTime / 1000 +
                  ' seconds',
              );
              this.logger.info(error.message);
              return timer(delayTime);
            },
          }),
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
  }

  async getSettings(): Promise<WhiInformation> {
    return await lastValueFrom(
      this.httpService
        .get<WhiInformation>(`${this.host}/settings`, {
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
  }

  async upload(project: Project, audio: Audio): Promise<MelvinAsrUploadEntity> {
    const audioPath = this.pathService.getAudioFile(
      project._id.toString(),
      audio,
      false,
    );

    const file = await readFile(audioPath);

    const formData = new FormData();
    formData.append(
      'audio_file',
      file,
      audio._id.toString() + '.' + audio.extension,
    );

    const res = await lastValueFrom(
      this.httpService
        .post<MelvinAsrUploadEntity>(`${this.host}/upload`, formData, {
          headers: {
            Authorization: this.apikey,
            'Content-Type': 'multipart/form-data',
            ...formData.getHeaders(),
          },
        })
        .pipe(
          map((res: AxiosResponse<MelvinAsrUploadEntity>) => {
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

    return res;
  }

  toWords(
    melvinResultEntity: MelvinAsrResultEntity,
    paragraphsViaTime: boolean,
  ): WordEntity[] {
    const words: WordEntity[] = [];

    let lastSegmentEnd = 0;
    melvinResultEntity.transcript.segments.forEach((segment) => {
      const secondsToLastSegment = segment.start - lastSegmentEnd;

      lastSegmentEnd = segment.end;

      segment.words.forEach((word, i) => {
        let startParagraph: boolean;

        if (paragraphsViaTime) {
          startParagraph = i === 0 && secondsToLastSegment > 3;
        } else {
          startParagraph = i === 0;
        }

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

    return words;
  }
}
