import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosResponse } from 'axios';
import FormData from 'form-data';
import { readFile } from 'fs-extra';
import { catchError, lastValueFrom, map } from 'rxjs';
import { Language } from '../../../app.interfaces';
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
import { WhiTranscribeDto, WhiTranscriptEntity } from './whisper.interfaces';

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

  async fetchLanguages(): Promise<Language[]> {
    if (!this.whisperConfig) {
      return null;
    }

    return new Promise((resolve) => {
      resolve([
        { code: 'en', name: 'English' },
        { code: 'de', name: 'German' },
        { code: 'fr', name: 'French' },
        { code: 'es', name: 'Spanish' },

        // von whisper -h
        //
        // af,am,ar,as,az,ba,be,bg,bn,bo,br,bs,ca,cs,cy,da,de,el,en,es,et,eu,fa,fi,fo,fr,gl,
        // gu,ha,haw,he,hi,hr,ht,hu,hy,id,is,it,ja,jw,ka,kk,km,kn,ko,la,lb,ln,lo,lt,lv,mg,mi,
        // mk,ml,mn,mr,ms,mt,my,ne,nl,nn,no,oc,pa,pl,ps,pt,ro,ru,sa,sd,si,sk,sl,sn,so,sq,sr,su,
        // sv,sw,ta,te,tg,th,tk,tl,tr,tt,uk,ur,uz,vi,yi,yo,zh,
        // Afrikaans,Albanian,Amharic,Arabic,Armenian,Assamese,Azerbaijani,Bashkir,Basque,Belarusian,
        // Bengali,Bosnian,Breton,Bulgarian,Burmese,Castilian,Catalan,Chinese,Croatian,Czech,Danish,Dutch,English,
        // Estonian,Faroese,Finnish,Flemish,French,Galician,Georgian,German,Greek,Gujarati,Haitian,Haitian Creole,Hausa,
        // Hawaiian,Hebrew,Hindi,Hungarian,Icelandic,Indonesian,Italian,Japanese,Javanese,Kannada,Kazakh,Khmer,Korean,Lao,
        // Latin,Latvian,Letzeburgesch,Lingala,Lithuanian,Luxembourgish,Macedonian,Malagasy,Malay,Malayalam,Maltese,Maori,
        // Marathi,Moldavian,Moldovan,Mongolian,Myanmar,Nepali,Norwegian,Nynorsk,Occitan,Panjabi,Pashto,Persian,Polish,
        // Portuguese,Punjabi,Pushto,Romanian,Russian,Sanskrit,Serbian,Shona,Sindhi,Sinhala,Sinhalese,Slovak,Slovenian,
        // Somali,Spanish,Sundanese,Swahili,Swedish,Tagalog,Tajik,Tamil,Tatar,Telugu,Thai,Tibetan,Turkish,Turkmen,Ukrainian,
        // Urdu,Uzbek,Valencian,Vietnamese,Welsh,Yiddish,Yoruba
      ]);
    });
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

    transcriptEntity.transcript.segments.forEach((segment) => {
      segment.words.forEach((word, i) => {
        words.push({
          text: word.text,
          start: word.start * 1000,
          end: word.end * 1000,
          confidence: word.probability,
          startParagraph: i === 0,
          speakerId: null,
        });
      });
    });

    return { words };
  }

  async _transcribe(project: Project, audio: Audio) {
    const audioPath = this.pathService.getMediaFile(
      project._id.toString(),
      audio,
    );

    const file = await readFile(audioPath);

    const formData = new FormData();
    formData.append('file', file, audio._id.toString() + '.' + audio.extension);
    const settings: WhiTranscribeDto = {
      language: project.language,
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
    const audioPath = this.pathService.getMediaFile(
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
