import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosResponse } from 'axios';
import { catchError, lastValueFrom, map } from 'rxjs';
import { LibreTranslateConfig } from '../../../config/config.interface';
import {
  LibreLanguagesEntity,
  LibreTranslateTextDto,
  LibreTranslateTextEntity,
} from './libre-translate.interfaces';

@Injectable()
export class LibreTranslateService {
  private libreTranslateConfig: LibreTranslateConfig;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.libreTranslateConfig =
      this.configService.get<LibreTranslateConfig>('libreTranslate');
  }

  async fetchLanguages(): Promise<LibreLanguagesEntity> {
    return await lastValueFrom(
      this.httpService
        .get<LibreLanguagesEntity>(`${this.libreTranslateConfig.url}/languages`)
        .pipe(
          map((res: AxiosResponse<LibreLanguagesEntity>) => res.data),
          catchError((error: AxiosError) => {
            throw new HttpException(error.response.data, error.response.status);
          }),
        ),
    );
  }

  public async translateText(
    texts: string[],
    sourceLang: string,
    targetLang: string,
  ): Promise<LibreTranslateTextEntity> {
    const dataBody: LibreTranslateTextDto = {
      source: sourceLang.substring(0, 2),
      target: targetLang.substring(0, 2),
      format: 'text',
      q: texts,
    };
    const response: LibreTranslateTextEntity = await lastValueFrom(
      this.httpService
        .post<LibreTranslateTextEntity>(
          `${this.libreTranslateConfig.url}/translate`,
          dataBody,
          {
            headers: { 'Content-type': 'application/json' },
          },
        )
        .pipe(
          map((res: AxiosResponse<LibreTranslateTextEntity>) => res.data),
          catchError((error: AxiosError) => {
            throw new HttpException(error.response.data, error.response.status);
          }),
        ),
    );
    return response;
  }
}
