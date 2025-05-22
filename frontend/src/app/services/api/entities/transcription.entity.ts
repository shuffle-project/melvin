export enum TranscriptionStatus {
  WAITING = 'waiting',
  PROCESSING = 'processing',
  OK = 'ok',
  ERROR = 'error',
}

export interface TranscriptionEntity {
  id: string;
  createdAt: string;
  createdBy: { id: string; name: string };
  updatedAt: string;
  project: string;
  title: string;
  language: string;
  speakers: SpeakerEntity[];
  status: TranscriptionStatus;
}
export interface ShortTranscriptionEntity {
  id: string;
  language: string;
  status: TranscriptionStatus;
}

export interface SpeakerEntity {
  id: string;
  updatedAt: string;
  name: string;
}

export enum SubtitleFormat {
  VTT = 'vtt',
  SRT = 'srt',
  TXT = 'txt',
}
