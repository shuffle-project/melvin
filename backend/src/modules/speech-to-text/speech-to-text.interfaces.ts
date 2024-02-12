import { Language } from '../../app.interfaces';
import { ProjectEntity } from '../../resources/project/entities/project.entity';
import { Audio } from '../db/schemas/project.schema';

export interface ISepechToTextService {
  fetchLanguages(): Promise<Language[] | null>;
  run(project: ProjectEntity, audio: Audio): Promise<TranscriptEntity | string>;
}

export class WordEntity {
  startMs: number;
  endMs: number;
  word: string;
}

// extend this class to get more values from asr services
export class TranscriptEntity {
  words: WordEntity[];
  captions?: { sentence: string; from: number; to: number }[];
}
