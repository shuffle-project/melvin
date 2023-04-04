export interface CreateCaptionDto {
  transcription: string;
  text: string;
  start: number;
  end: number;
  speakerId: string;
}
