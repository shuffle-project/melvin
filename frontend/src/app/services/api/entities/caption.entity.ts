export interface CaptionEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  project: string;
  transcription: string;
  updatedBy: string;
  wasManuallyEdited: boolean;
  initialText: string;
  text: string;
  start: number;
  end: number;
  speakerId: string;
  lockedBy: string | null;
  status: CaptionStatusEnum | null;
  history: CaptionHistoryEntity[];
}

export interface CaptionHistoryEntity {
  id: string;
  createdAt: string;
  createdBy: string;
  text: string;
}

export enum CaptionStatusEnum {
  FLAGGED = 'flagged',
  FINISHED = 'finished',
}

export interface TiptapCaption {
  id: string;
  text: string;
  start: number;
  end: number;
  speakerId: string;
}
