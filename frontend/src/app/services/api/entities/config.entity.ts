import { AsrVendors, TranslateVendors } from '../dto/create-transcription.dto';

export interface ConfigEntity {
  translationServices: TranslationServiceConfig[];
  asrServices: AsrServiceConfig[];
  languages: Language[];
  registrationMode: 'mail' | 'disabled';
}

export interface TranslationServiceConfig {
  fullName: string;
  translateVendor: TranslateVendors;
  languages: LanguageShort[];
}

export interface Language {
  code: string;
  englishName: string;
  germanName: string;
}

export interface LanguageShort {
  code: string;
  name: string;
}

export interface AsrServiceConfig {
  fullName: string;
  asrVendor: AsrVendors;
  languages: LanguageShort[];
}
