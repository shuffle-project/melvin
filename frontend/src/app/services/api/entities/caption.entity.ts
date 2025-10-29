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
  startParagraph: boolean;
}
