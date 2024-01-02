import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosResponse } from 'axios';
import FormData from 'form-data';
import { readFile } from 'fs-extra';
import { catchError, lastValueFrom, map } from 'rxjs';
import { Language } from '../../../app.interfaces';
import { WhisperConfig } from '../../../config/config.interface';
import { ProjectEntity } from '../../../resources/project/entities/project.entity';
import { DbService } from '../../db/db.service';
import { CustomLogger } from '../../logger/logger.service';
import { PathService } from '../../path/path.service';
import {
  ISepechToTextService,
  TranscriptEntity,
  WordEntity,
} from '../speech-to-text.interfaces';
import { WhiTranscribeDto, WhiTranscriptEntity } from './whisper.interfaces';

// npm rebuild bcrypt --build-from-source

@Injectable()
export class WhisperSpeechService implements ISepechToTextService {
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
        { code: 'auto', name: 'Auto' },

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

  async run(project: ProjectEntity): Promise<TranscriptEntity> {
    const transcribe = await this._transcribe(
      project._id.toString(),
      project.language,
    );
    // console.log(JSON.stringify(transcribe));

    // use cronJob/queue instead of
    const transcriptEntity: WhiTranscriptEntity = await new Promise(
      (resolve) => {
        const interval = setInterval(async () => {
          const transcriptEntityTemp = await this._getTranscript(
            transcribe.transcription_id,
          );
          // console.log(JSON.stringify(transcriptEntityTemp));
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

    // console.log(JSON.stringify(transcriptEntity));

    let currentMS = 0;
    const words: WordEntity[] = [];
    transcriptEntity.transcript.transcription.forEach((sentence) => {
      const splittedText = sentence.text.split(' ');
      const msSentence = sentence.offsets.to - sentence.offsets.from;
      const msPerWord = msSentence / splittedText.length;
      splittedText.forEach((word) => {
        words.push({ word, startMs: currentMS, endMs: currentMS + msPerWord });
        currentMS += msPerWord;
      });
    });

    // transcriptEntity.transcript

    return { words };
  }

  async _transcribe(projectId: string, language: string) {
    const audioPath = this.pathService.getWavFile(projectId);

    const file = await readFile(audioPath);

    const formData = new FormData();
    formData.append('file', file, 'audio.wav');
    const settings: WhiTranscribeDto = { language: language };
    formData.append('settings', JSON.stringify(settings));

    // console.log(formData.getHeaders());

    const response = await lastValueFrom(
      this.httpService
        .post<WhiTranscriptEntity>(
          `http://${this.host}:8393/transcriptions`,
          formData,
          {
            headers: {
              // authorization: this.apikey,
              // 'Transfer-Encoding': 'chunked',
              key: this.apikey,
              'Content-Type': 'multipart/form-data',
              ...formData.getHeaders(),
            },
          },
        )
        .pipe(
          map((res: AxiosResponse<WhiTranscriptEntity>) => {
            // console.log(res.data);
            return res.data;
          }),
          catchError((error: AxiosError) => {
            // console.log(error.response);
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
          `http://${this.host}:8393/transcriptions/${transcriptId}`,
          {
            headers: {
              // authorization: this.apikey,
              key: this.apikey,
            },
          },
        )
        .pipe(
          map((res: AxiosResponse<WhiTranscriptEntity>) => res.data),
          catchError((error: AxiosError) => {
            // console.log(error.response);
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
