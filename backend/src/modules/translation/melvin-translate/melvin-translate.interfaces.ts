import { WhiSegment } from 'src/modules/speech-to-text/whisper/whisper.interfaces';

export interface MelvinTranslateDto {
  language: string;
  target_language: string;
  transcript: {
    text: string;
    segments: WhiSegment[];
  };
}
