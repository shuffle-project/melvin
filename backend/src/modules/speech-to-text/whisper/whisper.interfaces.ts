export class WhiInformation {
  debug: boolean;
  rest_runner: any;
  websocket_stream: any;
  rest_port: number;
  websocket_port: number;
  host: string;
  keep_data_for_hours: number;
  cleanup_schedule_in_minutes: number;
  transcription_default: any;

  transcription_languages: string[];
  translation_languages: string[];
}

export class WhiTranscribeDto {
  language?: string;
  condition_on_previous_text?: boolean;
  task?: string;
}

export class WhiWord {
  end: number;
  probability: number;
  start: number;
  text: string;
}

export class WhiInterface {
  duration: number;
  duration_after_vad: number;
  language: string;
  language_probability: number;
  transcription_options: any;
  vad_options?: any;
}

export class WhiSegment {
  text: string;
  words: WhiWord[];
  start: number;
  end: number;
  avg_logprob?: number;
  compression_ratio?: number;
  id?: number;
  no_speech_prob?: number;
  seek?: number;
  temperature?: number;
  tokens?: any[];
}

export class WhiTranscriptEntity {
  settings: any;
  transcription_id: string;
  end_time: string;
  error_message: string;
  start_time: string;
  status: 'done' | 'error' | 'finished' | 'error';
  model: any;
  transcript: {
    info?: WhiInterface;
    segments: WhiSegment[];
  };
}
