export interface DeepLTranslateTextDto {
  auth_key: string;
  source_lang: string;
  target_lang: string;
  text: string[];
}

export interface DeepLTranslateTextEntity {
  translations: { detected_source_language: string; text: string }[];
}

export interface DeepLLanguageEntity {
  language: string;
  name: string;
}

export interface DeepLLanguagesEntity extends Array<DeepLLanguageEntity> {}
