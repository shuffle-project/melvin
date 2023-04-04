export interface GoogleTranslateTextDto {
  source: string;
  target: string;
  q: string[];
}

export interface GoogleTranslateTextEntity {
  data: {
    translations: {
      translatedText: string;
    }[];
  };
}

export interface GoogleLanguageEntity {
  language: string;
  name: string;
}

export interface GoogleLanguagesEntity {
  data: { languages: GoogleLanguageEntity[] };
}
