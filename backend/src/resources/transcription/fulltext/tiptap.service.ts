// hocuspocus.service.ts
import { TiptapTransformer } from '@hocuspocus/transformer';
import { Injectable } from '@nestjs/common';
import { getSchema } from '@tiptap/core';
import Color from '@tiptap/extension-color';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import TextStyle from '@tiptap/extension-text-style';
import { EditorState } from 'prosemirror-state';
import * as Y from 'yjs';
import { CustomLogger } from '../../../modules/logger/logger.service';
import { TipTapCaption, TiptapDocument, WordEntity } from './tiptap.interfaces';
import { Partial, Word } from './tiptap.schema';

@Injectable()
export class TiptapService {
  private schema = getSchema([
    Document,
    Paragraph,
    Text,
    TextStyle,
    Partial,
    Color,
    Word,
    // add more extensions here
  ]);
  constructor(private logger: CustomLogger) {}

  async createYDoc(): Promise<Y.Doc> {
    const doc = new Y.Doc();

    return await this.importDocument(doc, {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'This is your transcript!' }],
        },
      ],
    });
  }

  async getState(doc: Y.Doc): Promise<Uint8Array> {
    return Buffer.from(Y.encodeStateVector(doc));
  }

  // return type is our custom json
  docToJSON(doc: Y.Doc): TiptapDocument {
    this.logger.verbose('exportDocument');

    const pmDocJSON = TiptapTransformer.fromYdoc(doc, 'default');

    const editorState = EditorState.create({
      schema: this.schema,
      doc: this.schema.nodeFromJSON(pmDocJSON),
    });

    const result = editorState.doc.toJSON() as TiptapDocument;

    // Filter out empty paragraphs
    result.content = result.content.filter((p) => p.content?.length > 0);

    return result;
  }

  async importDocument(doc: Y.Doc, jsonDoc: TiptapDocument): Promise<Y.Doc> {
    this.logger.verbose('importDocument');

    const stateVector = Y.encodeStateVector(doc);
    const updatedYdoc = TiptapTransformer.toYdoc(jsonDoc, 'default', [
      Document,
      Paragraph,
      Text,
      TextStyle,
      Partial,
      Color,
      Word,
    ]);

    const update = Y.encodeStateAsUpdateV2(updatedYdoc, stateVector);
    Y.applyUpdateV2(doc, update);

    return doc;
  }

  docToWordList(doc: Y.Doc): WordEntity[] {
    const data = this.docToJSON(doc);
    const words = [];
    for (const paragraph of data.content) {
      for (const word of paragraph.content) {
        // TODO: parameter to force a new caption for paragraph starts
        words.push({
          text: word.text,
          confidence: word.marks[0]?.attrs.confidence,
          start: word.marks[0]?.attrs.timestamp,
          speakerId: paragraph.speakerId || null,
        });
      }
    }
    return words;
  }

  docToCaptions(doc: Y.Doc): TipTapCaption[] {
    const MIN_CHARACTERS = 40;
    const MAX_CHARACTERS = 80;
    const MAX_SILENCE = 5000;
    const SENTENCE_ENDING_CHARACTERS = ['.', ';', '!', '?'];
    const DEFAULT_WORD_DURATION = 1000;

    const isNewCaptionStarting = (
      caption: TipTapCaption,
      word: WordEntity,
    ): boolean => {
      if (caption.start === 0) {
        return false;
      }

      if (caption.speakerId && caption.speakerId !== word.speakerId) {
        return true;
      }

      const length = caption.text.length;

      if (length === 0) {
        return false;
      }

      if (MAX_SILENCE < word.start - caption.start) {
        return true;
      }

      if (length < MIN_CHARACTERS) {
        return false;
      }

      if (length + word.text.length > MAX_CHARACTERS) {
        return true;
      }

      if (length > MIN_CHARACTERS) {
        const trimmedText = caption.text.trimEnd();
        const lastCharacter = trimmedText[trimmedText.length - 1];
        if (SENTENCE_ENDING_CHARACTERS.includes(lastCharacter)) {
          return true;
        }
      }

      return false;
    };

    const wordList = this.docToWordList(doc);

    // Interpolation
    let speakerId = null;
    let lastStart = null;
    let missingTimestamps = 0;
    for (let i = 0; i < wordList.length; i++) {
      const word = wordList[i];
      // Speaker interpolation
      if (word.speakerId) {
        speakerId = word.speakerId;
      } else {
        word.speakerId = speakerId;
      }

      // Timestamp interpolation
      if (word.start) {
        if (missingTimestamps > 0) {
          if (lastStart === null) {
            lastStart = word.start - missingTimestamps * DEFAULT_WORD_DURATION;
          }

          const milliseconds = (word.start - lastStart) / missingTimestamps;
          for (let j = 1; j <= missingTimestamps; j++) {
            wordList[i - j].start = lastStart + j * milliseconds;
          }
        }
        lastStart = word.start;
        missingTimestamps = 0;
      } else {
        missingTimestamps++;

        if (i === wordList.length - 1 && missingTimestamps > 0) {
          if (lastStart === null) {
            lastStart = 0;
          }
          for (let j = 1; j <= missingTimestamps; j++) {
            wordList[i - j].start = lastStart + j * DEFAULT_WORD_DURATION;
          }
        }
      }
    }

    // TODO: meaningful breaks (punctuation, sentence end, etc.)
    // TODO: eventually break captions on comma?

    // TODO: Replace unicode characters?
    // export const replaceUnicodeCharacters = (text: string): string => {
    //   return text.replace(/&#([0-9]{1,4});/gi, (match, numStr) =>
    //     String.fromCharCode(parseInt(numStr, 10))
    //   );
    // };

    const captions: TipTapCaption[] = [];

    let currentCaption: TipTapCaption = {
      start: 0,
      text: '',
      end: 0,
      speakerId: null,
    };

    for (const word of wordList) {
      if (isNewCaptionStarting(currentCaption, word)) {
        // End caption
        currentCaption.end = word.start;
        captions.push(currentCaption);

        // Start new caption
        currentCaption = {
          start: word.start,
          text: word.text,
          end: 0,
          speakerId: word.speakerId,
        };
      } else {
        currentCaption.text += word.text; // TODO: Check if spaces are already in wordlist
      }
    }

    // Add last captions
    captions.push(currentCaption);

    return captions;
  }
}
