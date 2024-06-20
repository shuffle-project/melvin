interface TipTapWord {
  type: 'words';
  attrs: {
    modifiedAt?: string;
    modifiedBy?: string;
    timestamp?: number;
    confidence?: number;
  };
}

interface TipTapText {
  type: 'text';
  text: string;
  marks?: Array<TipTapWord>;
}

interface TipTapParagraph {
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
