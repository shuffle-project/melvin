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
  marks: Array<TipTapWord>;
}

interface TipTapParagraph {
  type: 'paragraph';
  content: Array<TipTapText>;
}

interface TiptapDocument {
  type: 'doc';
  content: Array<TipTapParagraph>;
}
