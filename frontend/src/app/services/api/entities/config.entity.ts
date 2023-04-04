import { AsrVendors, TranslateVendors } from '../dto/create-transcription.dto';

export interface ConfigEntity {
  translationServices: TranslationServiceConfig[];
  asrServices: AsrServiceConfig[];
  languages: Language[];
}

export interface TranslationServiceConfig {
  fullName: string;
  translateVendor: TranslateVendors;
  languages: Language[];
}

export interface Language {
  code: string;
  name: string;
}

export interface AsrServiceConfig {
  fullName: string;
  asrVendor: AsrVendors;
  languages: Language[];
}
