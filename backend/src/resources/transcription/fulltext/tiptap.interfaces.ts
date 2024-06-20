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
  marks: Array<TipTapWord>;
}

export interface TipTapParagraph {
  type: 'paragraph';
  content: Array<TipTapText>;
}

export interface TiptapDocument {
  type: 'doc';
  content: Array<TipTapParagraph>;
}
