export class AaUploadEntity {
  upload_url: string;
}

export class AaTranscriptDto {
  audio_url: string;
  language_code: string;
  language_detection?: boolean;
  // TODO keywords?
}

export class AaWordEntity {
  confidence: number;
  start: number;
  end: number;
  text: string;
}

export class AaTranscriptEntity {
  id: string;
  language_model: string;
  acoustic_model: string;
  language_code: string;
  status: string;
  audio_url: string;
  text: any;
  words: AaWordEntity[];
  utterances: any;
  confidence: number;
  audio_duration: number;
  punctuate: boolean;
  format_text: any;
  dual_channel: any;
  webhook_url: any;
  webhook_status_code: any;
  webhook_auth: boolean;
  webhook_auth_header_name: any;
  speed_boost: boolean;
  auto_highlights_result: any;
  auto_highlights: boolean;
  audio_start_from: any;
  audio_end_at: any;
  word_boost: any[];
  boost_param: any;
  filter_profanity: boolean;
  redact_pii: boolean;
  redact_pii_audio: boolean;
  redact_pii_audio_quality: any;
  redact_pii_policies: any;
  redact_pii_sub: any;
  speaker_labels: boolean;
  content_safety: boolean;
  iab_categories: boolean;
  content_safety_labels: any;
  iab_categories_result: any;
  language_detection: boolean;
  custom_spelling: any;
  disfluencies: boolean;
  sentiment_analysis: boolean;
  sentiment_analysis_results: any;
  auto_chapters: boolean;
  chapters: any;
  entity_detection: boolean;
  entities: any;
  error: string;
}
