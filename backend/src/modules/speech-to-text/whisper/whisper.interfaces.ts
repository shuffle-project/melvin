export class WhiTranscribeDto {}

export class WhiTranscriptEntity {
  transcription_id: string;
  end_time: string;
  error_message: string;
  start_time: string;
  status: string;
  transcript: {
    transcription: {
      offsets: { from: number; to: number };
      text: string;
      timestamps: { from: string; to: string };
    }[];
  };
}
