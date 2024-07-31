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
  speakerId?: string;
  content: Array<TiptapText>;
}

export interface TiptapDocument {
  type: 'doc';
  content: Array<TiptapParagraph>;
}

export interface TiptapCaption {
  // TODO brauchen wir um das im transkript suchen zu können. im frontend hinzufügen ?
  // oder direkt im backend? uuid? oder einfach hochzälen?
  id:string;
  text: string;
  start: number;
  end: number;
  speakerId: string;
}
