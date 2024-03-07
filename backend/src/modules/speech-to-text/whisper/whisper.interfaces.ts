export class WhiTranscribeDto {
  language?: string;
  condition_on_previous_text?: boolean;

  // "language": None,
  // "task": "transcribe",
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

export class WhiTranscriptEntity {
  settings: any;
  transcription_id: string;
  end_time: string;
  error_message: string;
  start_time: string;
  status: 'done' | 'error' | 'finished' | 'error';
  transcript: {
    info: any;
    segments: any[];
    //segments[x][2] will be the start
    //segments[x][3] will be the end
    //segments[x][4] will be the text

    // transcription: {
    //   offsets: { from: number; to: number };
    //   text: string;
    //   timestamps: { from: string; to: string };
    // }[];
  };
}
