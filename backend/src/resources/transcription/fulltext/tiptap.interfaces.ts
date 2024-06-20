export interface TipTapWord {
  type: 'word';
  attrs: {
    modifiedAt?: string;
    modifiedBy?: string;
    timestamp?: number;
    confidence?: number;
  };
}

export interface TipTapText {
  type: 'text';
  text: string;
  marks?: Array<TipTapWord>;
}

export interface TipTapParagraph {
  type: 'paragraph';
  speakerId?: string;
  content: Array<TipTapText>;
}

export interface TiptapDocument {
  type: 'doc';
  content: Array<TipTapParagraph>;
}

export interface TipTapCaption {
  text: string;
  start: number;
  end: number;
  speakerId: string;
}

export interface WordEntity {
  text: string;
  start: number;
  confidence: number;
  speakerId: string;
}
