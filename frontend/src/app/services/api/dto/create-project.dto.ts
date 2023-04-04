export interface CreateProjectDto {
  title: string;
  language: string;
  emails?: string[];
  sourceMode: 'video' | 'live';
  liveProject?: LiveProjectDto;
  videoProject?: VideoProjectDto;
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
