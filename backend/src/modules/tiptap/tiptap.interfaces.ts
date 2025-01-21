export interface TiptapWord {
  type: 'word';
  attrs: {
    modifiedAt?: string;
    modifiedBy?: string;
    // timestamp?: number;
    start?: number;
    end?: number;
    confidence?: number;
  };
}

export interface TiptapText {
  type: 'text';
  text: string;
  marks?: Array<TiptapWord>;
}

export interface TiptapParagraph {
  type: 'paragraph';
  // speakerId?: string;
  content: Array<TiptapText>;
  attrs: {
    speakerId?: string;
  };
}

export interface TiptapDocument {
  type: 'doc';
  content: Array<TiptapParagraph>;
}

export interface TiptapCaption {
  id: string;
  text: string;
  start: number;
  end: number;
  speakerId: string;
  startParagraph: boolean;
}
