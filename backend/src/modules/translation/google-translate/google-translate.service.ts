import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosResponse } from 'axios';
import { catchError, lastValueFrom, map } from 'rxjs';
import { GoogleTranslateConfig } from '../../../config/config.interface';

import {
  GoogleLanguagesEntity,
  GoogleTranslateTextDto,
  GoogleTranslateTextEntity,
} from './google-translate.interfaces';

@Injectable()
export class GoogleTranslateService {
  private googleTranslateConfig: GoogleTranslateConfig;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.googleTranslateConfig =
      this.configService.get<GoogleTranslateConfig>('googleTranslate');
  }

  async fetchLanguages(): Promise<GoogleLanguagesEntity> {
    return await lastValueFrom(
      this.httpService
        .get<GoogleLanguagesEntity>(
          `${this.googleTranslateConfig.url}/languages?key=${this.googleTranslateConfig.apikey}&target=en`,
        )
        .pipe(
          map((res: AxiosResponse<GoogleLanguagesEntity>) => res.data),
          catchError((error: AxiosError) => {
            throw new HttpException(error.response.data, error.response.status);
          }),
        ),
    );
  }

  async translateText(
    texts: string[],
    sourceLang: string,
    targetLang: string,
  ): Promise<GoogleTranslateTextEntity> {
    const body: GoogleTranslateTextDto = {
      q: texts,
      target: targetLang,
      source: sourceLang,
    };
    const response: GoogleTranslateTextEntity = await lastValueFrom(
      this.httpService
        .post<GoogleTranslateTextEntity>(
          `${this.googleTranslateConfig.url}?key=${this.googleTranslateConfig.apikey}`,
          body,
        )
        .pipe(
          map((res: AxiosResponse<GoogleTranslateTextEntity>) => res.data),
          catchError((error: AxiosError) => {
            throw new HttpException(error.response.data, error.response.status);
          }),
        ),
    );
    return response;
  }
}
