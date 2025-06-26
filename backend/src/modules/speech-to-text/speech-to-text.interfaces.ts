import { CaptionEntity } from 'src/resources/caption/entities/caption.entity';
import { TranscriptionEntity } from 'src/resources/transcription/entities/transcription.entity';
import { LanguageShort } from '../../app.interfaces';
import { ProjectEntity } from '../../resources/project/entities/project.entity';
import { Audio } from '../db/schemas/project.schema';
import { MelvinAsrTranscript } from '../melvin-asr-api/melvin-asr-api.interfaces';

export interface ISpeechToTextService {
  fetchLanguages(): Promise<LanguageShort[] | null>;
  run(
    project: ProjectEntity,
    audio: Audio,
    transcription: TranscriptionEntity,
  ): void;
  runAlign(
    project: ProjectEntity,
    transcript: MelvinAsrTranscript,
    audio: Audio,
    transcription: TranscriptionEntity,
    syncSpeaker?: CaptionEntity[],
  ): void;
}

export class WordEntity {
  text: string;
  start: number; // in milliseconds
  end: number; // in milliseconds
  startParagraph: boolean;
  speakerId: string | null;
  confidence?: number;
}

// extend this class to get more values from asr services
export class TranscriptEntity {
  words: WordEntity[];
  captions?: { sentence: string; from: number; to: number }[];
}
