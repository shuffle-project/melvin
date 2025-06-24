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

  // "language": None,
  // "beam_size": 5,
  // "best_of": 5,
  // "patience": 1.0,
  // "length_penalty": 1.0,
  // "repetition_penalty": 1.0,
  // "no_repeat_ngram_size": 0,
  // "temperature": [0, 0.2, 0.4, 0.6, 0.8, 1],
  // "compression_ratio_threshold": 2.4,
  // "log_prob_threshold": -1,
  // "no_speech_threshold": 0.6,
  // "condition_on_previous_text": True,
  // "prompt_reset_on_temperature": 0.5,
  // "initial_prompt": None,
  // "prefix": None,
  // "suppress_blank": True,
  // "suppress_tokens": [-1],
  // "without_timestamps": False,
  // "max_initial_timestamp": 1,
  // "word_timestamps": False,
  // "prepend_punctuations": "\"'“¿([{-",
  // "append_punctuations": "\"'.。,，!！?？:：”)]}、",
  // "vad_filter": False,
  // "vad_parameters": None,
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
