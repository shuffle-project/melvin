export class WhiTranscribeDto {
  // Audio Processing Options
  offset_t?: number; //Time offset in milliseconds for audio processing. Default value is 0.
  offset_n?: number; // Segment index offset. Default value is 0.
  duration?: number; // Duration of the audio to process, specified in milliseconds. Default value is 0.

  // Context and Length Settings
  max_context?: number; // Maximum number of text context tokens to store. Default is -1, indicating no limit.
  max_len?: number; // Maximum length for a text segment, measured in characters. Default value is 0.

  // Text Segmentation
  split_on_word?: boolean; //Determines whether to split text based on words. Default is False, indicating splitting on tokens.

  // Decoding and Search Settings
  best_of?: number; // Number of best candidates to keep during processing. Default value is 2.
  beam_size?: number; //Size of the beam for beam search algorithms. Default is -1, which implies a standard setting.
  word_thold?: number; // Threshold for word timestamp probability. Default value is 0.01.
  entropy_thold?: number; // Entropy threshold for the decoder to identify fail conditions. Default value is 2.40.
  logprob_thold?: number; //Log probability threshold for decoder failure conditions. Default value is -1.00.

  // Debugging and Modes
  debug_mode?: boolean; // Toggles debug mode. Default is False.
  translate?: boolean; //Enables translation from the source language to English. Default is False.
  diarize?: boolean; //Enables stereo audio diarization. Default is False.
  tinydiarize?: boolean; //Activates a smaller, possibly less resource-intensive diarization model. Default is False.
  no_fallback?: boolean; //Disables the use of temperature fallback while decoding. Default is False.
  no_timestamps?: boolean; //Opts out of printing timestamps in outputs. Default is False.

  // Language and Input Settings
  language?: string; //Specifies the language of the input. Default is None, which may imply automatic detection or a standard language setting.
  prompt?: string; //Initial prompt for the system. Default is None, indicating no initial prompt.

  // Hardware and Execution Settings
  ov_e_device?: string; //Specifies the OpenVINO device used for encode inference. Default setting is "CPU".
}

export class WhiTranscriptEntity {
  settings: any;
  transcription_id: string;
  end_time: string;
  error_message: string;
  start_time: string;
  status: 'done' | 'error' | 'finished' | 'error';
  transcript: {
    transcription: {
      offsets: { from: number; to: number };
      text: string;
      timestamps: { from: string; to: string };
    }[];
  };
}
