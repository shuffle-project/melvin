import { LanguageShort } from '../../app.interfaces';
import { ProjectEntity } from '../../resources/project/entities/project.entity';
import { Audio } from '../db/schemas/project.schema';

export interface ISpeechToTextService {
  fetchLanguages(): Promise<LanguageShort[] | null>;
  run(project: ProjectEntity, audio: Audio): Promise<TranscriptEntity | string>;
  runAlign(project: ProjectEntity, text: string, audio: Audio): Promise<any>;
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
