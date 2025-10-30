import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { TranslationServiceConfig } from '../../app.interfaces';
import {
  TranslateVendors,
  TranslationPayload,
} from '../../processors/processor.interfaces';
import { AuthService } from '../../resources/auth/auth.service';
import { TranscriptionEntity } from '../../resources/transcription/entities/transcription.entity';
import { DbService } from '../db/db.service';
import { Project } from '../db/schemas/project.schema';
import { CustomLogger } from '../logger/logger.service';
import { WhiSegment } from '../speech-to-text/whisper/whisper.interfaces';
import { TiptapService } from '../tiptap/tiptap.service';
import { DeepLService } from './deepl/deepl.service';
import { GoogleTranslateService } from './google-translate/google-translate.service';
import { LibreTranslateService } from './libre-translate/libre-translate.service';
import { MelvinTranslateDto } from './melvin-translate/melvin-translate.interfaces';
import { MelvinTranslateService } from './melvin-translate/melvin-translate.service';

@Injectable()
export class TranslationService {
  constructor(
    private logger: CustomLogger,
    private authService: AuthService,
    private db: DbService,
    private libreTranslate: LibreTranslateService,
    private deepL: DeepLService,
    private googleTranslate: GoogleTranslateService,
    private configService: ConfigService,
    private melvinTranslate: MelvinTranslateService,
    private tiptapService: TiptapService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  private serviceConfigs: {
    deepl: TranslationServiceConfig | null;
    libre: TranslationServiceConfig | null;
    googleTranslate: TranslationServiceConfig | null;
    melvinTranslate: TranslationServiceConfig | null;
  } = {
    deepl: null,
    libre: null,
    googleTranslate: null,
    melvinTranslate: null,
  };

  async initServices() {
    if (this.configService.get('whisper')) {
      try {
        const melvin = (await this.melvinTranslate.fetchLanguages()) || null;
        if (melvin) {
          this.serviceConfigs.libre = {
            fullName: 'Melvin',
            translateVendor: TranslateVendors.MELVIN,
            languages: melvin.map((obj) => ({
              code: obj.code,
              name: obj.name,
            })),
          };
        }
      } catch (error) {
        //do nothing, languages will be null = service not initialized
      }
    }

    if (this.configService.get('libreTranslate')) {
      try {
        const libre = (await this.libreTranslate.fetchLanguages()) || null;
        if (libre) {
          this.serviceConfigs.libre = {
            fullName: 'LibreTranslate',
            translateVendor: TranslateVendors.LIBRE,
            languages: libre.map((obj) => ({
              code: obj.code,
              name: obj.name,
            })),
          };
        }
      } catch (error) {
        //do nothing, languages will be null = service not initialized
      }
    }

    if (this.configService.get('deepL')) {
      try {
        const deepl = (await this.deepL.fetchLanguages()) || null;
        if (deepl) {
          this.serviceConfigs.deepl = {
            fullName: 'DeepL',
            translateVendor: TranslateVendors.DEEPL,
            languages: deepl.map((obj) => ({
              code: obj.language,
              name: obj.name,
            })),
          };
        }
      } catch (error) {
        //do nothing, languages will be null = service not initialized
      }
    }

    if (this.configService.get('googleTranslate')) {
      try {
        const googleTranslate =
          (await this.googleTranslate.fetchLanguages()) || null;
        if (googleTranslate) {
          this.serviceConfigs.googleTranslate = {
            fullName: 'Google Translate',
            translateVendor: TranslateVendors.GOOGLE,
            languages: googleTranslate.data.languages.map((obj) => ({
              code: obj.language,
              name: obj.name,
            })),
          };
        }
      } catch (error) {
        //do nothing, languages will be null = service not initialized
      }
    }
  }

  getConfig(): TranslationServiceConfig[] {
    const translationServices: TranslationServiceConfig[] = [];

    if (this.serviceConfigs.deepl) {
      translationServices.push(this.serviceConfigs.deepl);
    }

    if (this.serviceConfigs.libre) {
      translationServices.push(this.serviceConfigs.libre);
    }

    if (this.serviceConfigs.googleTranslate) {
      translationServices.push(this.serviceConfigs.googleTranslate);
    }

    if (this.serviceConfigs.melvinTranslate) {
      translationServices.push(this.serviceConfigs.melvinTranslate);
    }

    return translationServices;
  }

  async translateTranscription(
    project: Project,
    source: TranscriptionEntity,
    target: TranscriptionEntity,
    translationPayload: TranslationPayload,
  ) {
    this.logger.info(
      `Translate transcription ${source._id} into ${target._id} - ${translationPayload.targetLanguage}`,
    );
    const systemUser = await this.authService.findSystemAuthUser();

    const tiptapDocument = await this.tiptapService.getTiptapDocument(
      source._id.toString(),
    );

    //copy speakers
    // key is the speaker in the old transcriptzion, value is the speaker in the new transcription
    const speakerMap: Map<string, string> = new Map();

    const newSpeakers = source.speakers.map((speaker) => {
      const newSpeakerId = new Types.ObjectId();
      speakerMap.set(speaker._id.toString(), newSpeakerId.toString());
      return {
        _id: new Types.ObjectId(newSpeakerId),
        name: speaker.name,
      };
    });

    await this.db.transcriptionModel.findByIdAndUpdate(target._id, {
      $push: { speakers: { $each: newSpeakers } },
    });

    // const textsToTranslate = [];
    // const counterPerSection = [];
    // let counter = 0;
    // let text = '';
    // let previousCaptionSpeaker = null;
    // createCaptionDtos.forEach((dto) => {
    //   if (dto.speakerId === previousCaptionSpeaker) {
    //     counter++;
    //     text = text + ' ' + dto.text;
    //   } else {
    //     previousCaptionSpeaker = dto.speakerId;
    //     if (text.length > 0) {
    //       counterPerSection.push(counter);
    //       textsToTranslate.push(text);
    //     }
    //     text = dto.text + '';
    //     counter = 1;
    //   }
    // });
    // counterPerSection.push(counter);
    // textsToTranslate.push(text);

    //translate with vendor
    // let translatedTexts: string[] = []; // textsToTranslate translated
    switch (translationPayload.vendor) {
      case TranslateVendors.MELVIN:
        this.logger.info('Translate with ' + TranslateVendors.MELVIN);

        let text = '';
        const segments: WhiSegment[] = [];

        tiptapDocument.content.forEach((paragraph) => {
          const segment: WhiSegment = {
            start: 0,
            end: 0,
            text: paragraph.content.map((x) => x.text).join(''),
            words: paragraph.content.map((word) => {
              return {
                text: word.text,
                start: (word.marks[0].attrs.start / 1000) | 0,
                end: (word.marks[0].attrs.end / 1000) | 0,
                probability: word.marks[0].attrs.confidence | 0,
              };
            }),
          };
          text += segment.text;

          segment.start = segment.words[0].start;
          segment.end = segment.words[segment.words.length - 1].end;
          segments.push(segment);
        });
        //

        const melvinTranslateDto: MelvinTranslateDto = {
          language: source.language.startsWith('en-') ? 'en' : source.language,
          target_language: translationPayload.targetLanguage.startsWith('en-')
            ? 'en'
            : translationPayload.targetLanguage,
          transcript: {
            text,
            segments,
          },
        };

        await this.melvinTranslate.run(
          melvinTranslateDto,
          project,
          target,
          newSpeakers[0]._id.toString(),
        );

        break;

      case TranslateVendors.LIBRE:
        this.logger.info('Translate with ' + TranslateVendors.LIBRE);
        throw new Error('not_implemented');
        // const libreEntity = await this.libreTranslate.translateText(
        //   textsToTranslate,
        //   source.language,
        //   translationPayload.targetLanguage,
        // );
        // translatedTexts = libreEntity.translatedText;
        break;

      case TranslateVendors.DEEPL:
        this.logger.info('Translate with ' + TranslateVendors.DEEPL);
        throw new Error('not_implemented');
        // const deeplEntity = await this.deepL.translateText(
        //   textsToTranslate,
        //   source.language,
        //   translationPayload.targetLanguage,
        // );
        // translatedTexts = deeplEntity.translations.map((obj) => obj.text);
        break;

      case TranslateVendors.GOOGLE:
        this.logger.info('Translate with ' + TranslateVendors.GOOGLE);
        throw new Error('not_implemented');
        // const googleEntity = await this.googleTranslate.translateText(
        //   textsToTranslate,
        //   source.language,
        //   translationPayload.targetLanguage,
        // );
        // translatedTexts = googleEntity.data.translations.map(
        //   (obj) => obj.translatedText,
        // );
        break;
    }
  }

  _countWords(text: string): number {
    return text.split(' ').length;
  }
}
