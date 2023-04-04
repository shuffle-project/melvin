export interface LibreTranslateTextDto {
  source: string;
  target: string;
  format: 'text' | 'html';
  q: string[];
}

export interface LibreTranslateTextEntity {
  translatedText: string[];
}

export interface LibreLanguageEntity {
  code: string;
  name: string;
}

export interface LibreLanguagesEntity extends Array<LibreLanguageEntity> {}
