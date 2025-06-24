export class MelvinAsrUploadEntity {
  filename: string;
}

export class MelvinAsrJobEntity {
  id: string;
  job_type: 'transcription' | 'translation' | 'alignment';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  created_at: string;
  started_at: string | null;
  completed_at: string | null;

  settings?: {
    audio_filename: string;
    language: string;
    vad_filter: boolean;
    condition_on_previous_text: boolean;
    batched_inference: boolean;
    initial_prompt: string;
  };
}

export class MelvinAsrWord {
  text: string;
  start: number;
  end: number;
  probability?: number;
}

export class MelvinAsrSegment {
  text: string;
  start: number;
  end: number;
  words: MelvinAsrWord[];
}

export class MelvinAsrTranscript {
  text: string;
  segments: MelvinAsrSegment[];
}

export class MelvinAsrResultEntity {
  transcript: MelvinAsrTranscript;
  rawResult?: any;
}

export class MelvinAsrTranscribeDto {
  audio_filename: string;
  language: string;
  vad_filter?: boolean;
  condition_on_previous_text?: boolean;
  batched_inference?: boolean;
  initial_prompt?: string;
}

export class MelvinAsrTranslateDto {
  source_language: string;
  target_language: string;
  transcript: MelvinAsrTranscript;
}

export class MelvinAsrAlignByAudioDto {
  method: 'by_audio';
  transcript: MelvinAsrTranscript;
  language: string;
  audio_filename: string;
}
export class MelvinAsrAlignByTranscripDto {
  method: 'by_transcript';
  transcript: MelvinAsrTranscript;
  transcript_with_timings: MelvinAsrTranscript;
}
export class MelvinAsrAlignByTimeDto {
  method: 'by_time';
  transcript: MelvinAsrTranscript;
  start: number;
  end: number;
}
