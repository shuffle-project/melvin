export interface CreateTranscriptionDto {
  project: string;
  title: string;
  language: string;
  translateDto?: TranslateDto;
  asrDto?: AsrDto;
  copyDto?: CopyDto;
  uploadId?: string;
}

export interface TranslateDto {
  sourceTranscriptionId: string;
  vendor: TranslateVendors;
  targetLanguage: string;
}

export interface AsrDto {
  vendor: AsrVendors;
}

export interface CopyDto {
  sourceTranscriptionId: string;
}

export enum TranslateVendors {
  LIBRE = 'libreTranslate',
  DEEPL = 'deepl',
  GOOGLE = 'googleTranslate',
  MELVIN = 'melvin',
}

export enum AsrVendors {
  RANDOM = 'random',
  GOOGLE = 'google',
  ASSEMBLYAI = 'assemblyai',
  WHISPER = 'whisper',
}
