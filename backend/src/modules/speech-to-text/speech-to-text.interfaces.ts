import { Language } from '../../app.interfaces';
import { ProjectEntity } from '../../resources/project/entities/project.entity';

export interface ISepechToTextService {
  fetchLanguages(): Promise<Language[] | null>;
  run(project: ProjectEntity): Promise<TranscriptEntity | string>;
}

export class WordEntity {
  startMs: number;
  endMs: number;
  word: string;
}

// extend this class to get more values from asr services
export class TranscriptEntity {
  words: WordEntity[];
}
