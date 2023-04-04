import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosResponse } from 'axios';
import FormData from 'form-data';
import { catchError, lastValueFrom, map } from 'rxjs';
import { DeepLConfig } from '../../../config/config.interface';
import {
  DeepLLanguagesEntity,
  DeepLTranslateTextEntity,
} from './deepl.interfaces';

@Injectable()
export class DeepLService {
  private deepLConfig: DeepLConfig;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.deepLConfig = this.configService.get<DeepLConfig>('deepL');
  }

  async fetchLanguages(): Promise<DeepLLanguagesEntity> {
    return await lastValueFrom(
      this.httpService
        .get<DeepLLanguagesEntity>(
          `${this.deepLConfig.url}/languages?auth_key=${this.deepLConfig.apikey}`,
        )
        .pipe(
          map((res: AxiosResponse<DeepLLanguagesEntity>) => res.data),
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
  ): Promise<DeepLTranslateTextEntity> {
    const formData = new FormData();
    formData.append('auth_key', this.deepLConfig.apikey);
    formData.append('source_lang', sourceLang.substring(0, 2));
    formData.append('target_lang', targetLang.substring(0, 2));
    texts.forEach((element) => {
      formData.append('text', element);
    });

    const response: DeepLTranslateTextEntity = await lastValueFrom(
      this.httpService
        .post<DeepLTranslateTextEntity>(
          `${this.deepLConfig.url}/translate`,
          formData,
          {
            headers: { 'Content-type': 'multipart/form-data' },
          },
        )
        .pipe(
          map((res: AxiosResponse<DeepLTranslateTextEntity>) => res.data),
          catchError((error: AxiosError) => {
            throw new HttpException(error.response.data, error.response.status);
          }),
        ),
    );
    return response;
  }
}
