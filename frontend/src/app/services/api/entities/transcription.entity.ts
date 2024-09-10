export interface TranscriptionEntity {
  id: string;
  createdAt: string;
  createdBy: { id: string; name: string };
  updatedAt: string;
  project: string;
  title: string;
  language: string;
  speakers: SpeakerEntity[];
}
export interface ShortTranscriptionEntity {
  id: string;
  language: string;
}

export interface SpeakerEntity {
  id: string;
  updatedAt: string;
  name: string;
}

export interface ShortTranscriptionEntity {
  id: string;
  language: string;
}

export enum SubtitleFormat {
  VTT = 'vtt',
  SRT = 'srt',
  TXT = 'txt',
}
