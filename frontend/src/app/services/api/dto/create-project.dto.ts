import { AsrVendors } from './create-transcription.dto';

export interface VideoOption {
  uploadId: string;
  category: string;
  useAudio: boolean;
}

export interface SubtitleOption {
  uploadId: string;
  language: string;
}

export interface CreateProjectDto {
  asrVendor: AsrVendors;
  title: string;
  language: string;
  emails?: string[];
  sourceMode: 'video' | 'live';
  liveProject?: LiveProjectDto;
  videoProject?: VideoProjectDto;

  videoOptions: VideoOption[];
  subtitleOptions?: SubtitleOption[];
}

export interface LiveProjectDto {
  url: string;
  asr?: ASRDto;
}

export interface VideoProjectDto {
  videoFile: { content: File; language: string };
  subtitleFiles?: { content: File; language: string }[];
  asr?: ASRDto;
}

export interface ASRDto {
  asrVendor: string;
  language: string;
}
