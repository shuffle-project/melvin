import { TiptapTransformer } from '@hocuspocus/transformer';
import { Injectable } from '@nestjs/common';
import { getSchema } from '@tiptap/core';
import Bold from '@tiptap/extension-bold';
import Color from '@tiptap/extension-color';
import { Document } from '@tiptap/extension-document';
import { Text } from '@tiptap/extension-text';
import TextStyle from '@tiptap/extension-text-style';
import { IncomingMessage } from 'http';
import { EditorState } from 'prosemirror-state';
import { WebSocket } from 'ws';
import { updateYFragment } from 'y-prosemirror';
import * as Y from 'yjs';
import { CustomLogger } from '../logger/logger.service';
import { WordEntity } from '../speech-to-text/speech-to-text.interfaces';
import { HocuspocusService } from './hocuspocus.service';
import {
  TiptapCaption,
  TiptapDocument,
  TiptapParagraph,
} from './tiptap.interfaces';
import { CustomParagraph, Partial, Word } from './tiptap.schema';

const EXTENSIONS = [
  Document,
  CustomParagraph,
  Text,
  TextStyle,
  Partial,
  Color,
  Word,
  Bold,
];
@Injectable()
export class TiptapService {
  private schema = getSchema(EXTENSIONS);

  constructor(
    private hocuspocusService: HocuspocusService,
    private logger: CustomLogger,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  public handleConnection(
    websocket: WebSocket,
    request: IncomingMessage,
    context: any,
  ) {
    this.hocuspocusService.handleConnection(websocket, request, context);
  }

  async updateDocument(transcriptionId: string, jsonDoc: TiptapDocument) {
    const connection = await this.hocuspocusService.openDirectConnection(
      transcriptionId,
    );

    await connection.transact((doc) => {
      const stateVector = Y.encodeStateVector(doc);

      const updatedYdoc = TiptapTransformer.toYdoc(
        jsonDoc,
        'default',
        EXTENSIONS,
      );

      const update = Y.encodeStateAsUpdateV2(updatedYdoc, stateVector);
      Y.applyUpdateV2(doc, update);
    });

    connection.disconnect();
  }

  toYDoc(uint8array: Uint8Array): Y.Doc {
    const ydoc = new Y.Doc();
    const update = Y.encodeStateAsUpdateV2(ydoc, uint8array);
    Y.applyUpdateV2(ydoc, update);
    return ydoc;
  }

  async insert(transcriptionId: string, text: string) {
    this.logger.verbose('insert');
    const connection = await this.hocuspocusService.openDirectConnection(
      transcriptionId,
    );

    await connection.transact((doc) => {
      const pmDocJSON = TiptapTransformer.fromYdoc(doc, 'default');

      const docNode = this.schema.nodeFromJSON(pmDocJSON);
      const editorState = EditorState.create({
        schema: this.schema,
        doc: docNode,
      });
      let { tr } = editorState;
      const text_to_insert = text;
      // Create a transaction to insert text at the end
      tr = tr.insertText(text_to_insert, docNode.content.size);
      //TODO dont use timestamp -> use start/end -> add types
      tr.addMark(
        docNode.content.size,
        docNode.content.size + text_to_insert.length + 1,
        this.schema.marks.word.create({
          modifiedAt: new Date().toTimeString(),
          modifiedBy: null,
          timestamp: new Date().getTime(),
        }),
      );
      const yDocNode = doc.getXmlFragment('default');

      updateYFragment(doc, yDocNode, tr.doc, new Map());
    });

    await connection.disconnect();
  }

  async insertStream(transcriptionId: string) {
    this.logger.verbose('insertStream');

    const connection = await this.hocuspocusService.openDirectConnection(
      transcriptionId,
    );
    const lorem =
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
    const words = lorem.split(' ');
    let index = 0;
    let word = null;
    // Create a new paragraph before the word insertion
    await connection.transact(async (doc) => {
      const pmDocJSON = TiptapTransformer.fromYdoc(
        connection.document,
        'default',
      );
      const docNode = this.schema.nodeFromJSON(pmDocJSON);

      const editorState = EditorState.create({
        schema: this.schema,
        doc: docNode,
      });
      let { tr } = editorState;

      // Create and insert a new paragraph
      const newParagraph = this.schema.nodes.paragraph.createAndFill();

      tr = tr.insert(tr.doc.content.size, newParagraph);

      const yDocNode = doc.getXmlFragment('default');
      updateYFragment(doc, yDocNode, tr.doc, new Map());
    });
    // fake stream of words to insert with an interval of 300ms
    const interval = setInterval(async () => {
      await connection.transact(async (doc) => {
        // If all words are inserted, clear the interval and disconnect
        if (index >= words.length) {
          clearInterval(interval);
          await connection.disconnect();
          return;
        }
        const pmDocJSON = TiptapTransformer.fromYdoc(
          connection.document,
          'default',
        );

        const docNode = this.schema.nodeFromJSON(pmDocJSON);

        const editorState = EditorState.create({
          schema: this.schema,
          doc: docNode,
        });
        let { tr } = editorState;
        word = words[index];
        const startPos = tr.doc.content.size - 1;
        tr = tr.insertText(word, startPos);
        tr.addMark(
          docNode.content.size - 1,
          docNode.content.size - 1 + word.length,
          this.schema.marks.word.create({
            timestamp: new Date().getTime(),
            modifiedBy: 'Server Stream Insert',
            modifiedAt: new Date().toISOString(),
          }),
        );
        const yDocNode = doc.getXmlFragment('default');
        updateYFragment(doc, yDocNode, tr.doc, new Map());

        index++;
      });
      await connection.transact(async (doc) => {
        if (index >= words.length) {
          clearInterval(interval);
          await connection.disconnect();
          return;
        }
        const pmDocJSON = TiptapTransformer.fromYdoc(
          connection.document,
          'default',
        );
        const docNode = this.schema.nodeFromJSON(pmDocJSON);

        const editorState = EditorState.create({
          schema: this.schema,
          doc: docNode,
        });
        const yDocNode = doc.getXmlFragment('default');
        let { tr } = editorState;

        const space = this.schema.text(' ');
        tr = tr.insert(tr.doc.content.size - 1, space);

        updateYFragment(doc, yDocNode, tr.doc, new Map());
      });
    }, 125);
  }

  async insertPartial(transcriptionId: string) {
    this.logger.verbose('insertPartial');

    const connection = await this.hocuspocusService.openDirectConnection(
      transcriptionId,
    );

    const lorem =
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
    const words = lorem.split(' ');
    let index = 0;

    // create a new paragraph
    await connection.transact(async (doc) => {
      const pmDocJSON = TiptapTransformer.fromYdoc(
        connection.document,
        'default',
      );
      const docNode = this.schema.nodeFromJSON(pmDocJSON);

      const editorState = EditorState.create({
        schema: this.schema,
        doc: docNode,
      });
      let { tr } = editorState;

      // Create and insert a new paragraph
      const newParagraph = this.schema.nodes.paragraph.createAndFill();
      tr = tr.insert(tr.doc.content.size, newParagraph);

      const yDocNode = doc.getXmlFragment('default');
      updateYFragment(doc, yDocNode, tr.doc, new Map());
    });
    // Insert partial words with a delay of 300ms
    for (let i = 0; i < words.length; i += 5) {
      const partialWords = words.slice(i, i + 5);
      // Insert partial words
      for (const partialWord of partialWords) {
        await new Promise((resolve) => setTimeout(resolve, 300)); // Delay for demonstration
        await connection.transact(async (doc) => {
          const pmDocJSON = TiptapTransformer.fromYdoc(
            connection.document,
            'default',
          );
          const docNode = this.schema.nodeFromJSON(pmDocJSON);
          let { tr } = EditorState.create({
            schema: this.schema,
            doc: docNode,
          });
          tr = tr.insertText(partialWord, docNode.content.size - 1);

          tr.addMark(
            docNode.content.size - 1,
            docNode.content.size - 1 + partialWord.length,
            this.schema.marks.partial.create({
              isPartial: true,
              contenteditable: false,
            }),
          );

          updateYFragment(
            doc,
            doc.getXmlFragment('default'),
            tr.doc,
            new Map(),
          );
          index++;
        });
        await connection.transact(async (doc) => {
          const pmDocJSON = TiptapTransformer.fromYdoc(
            connection.document,
            'default',
          );
          const docNode = this.schema.nodeFromJSON(pmDocJSON);

          const editorState = EditorState.create({
            schema: this.schema,
            doc: docNode,
          });
          const yDocNode = doc.getXmlFragment('default');
          let { tr } = editorState;

          const space = this.schema.text(' ');
          tr = tr.insert(tr.doc.content.size - 1, space);

          updateYFragment(doc, yDocNode, tr.doc, new Map());
        });
      }

      // Replace partial words with final words
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Adjust the delay as needed

      const pmDocJSON = TiptapTransformer.fromYdoc(
        connection.document,
        'default',
      );
      let { tr } = EditorState.create({
        schema: this.schema,
        doc: this.schema.nodeFromJSON(pmDocJSON),
      });
      await connection.transact(async (doc) => {
        tr.doc.descendants((node, pos) => {
          if (
            node.isText &&
            node.marks.find((mark) => mark.type.name === 'partial')
          ) {
            const startPos = pos;
            const endPos = startPos + node.nodeSize;
            const wordsToInsert = node.text.split(/\s+/); // Split text by spaces
            this.logger.verbose('wordsToInsert', wordsToInsert);
            tr = tr.delete(startPos, endPos);

            let currentPos = startPos;

            wordsToInsert.forEach((word, index) => {
              if (word.trim() !== '') {
                // It's a word
                tr = tr.insertText(word, currentPos);

                tr.addMark(
                  currentPos,
                  currentPos + word.length,
                  this.schema.marks.word.create({
                    timestamp: new Date().getTime(),
                    modifiedBy: 'Server Partial Insert',
                    modifiedAt: new Date().toISOString(),
                  }),
                );

                currentPos += word.length; // Move position to after the word

                // Insert a space after each word except the last one
                if (index < wordsToInsert.length - 1) {
                  tr = tr.insertText(' ', currentPos);
                  currentPos += 1; // Move position to after the space
                }
              }
            });

            updateYFragment(
              doc,
              doc.getXmlFragment('default'),
              tr.doc,
              new Map(),
            );
          }
        });

        await new Promise((resolve) => setTimeout(resolve, 300)); // Adjust the delay as needed
      });
    }
    await connection.disconnect();
  }

  wordsToTiptap(words: WordEntity[], defaultSpeaker: string): TiptapDocument {
    const tiptapDocument: TiptapDocument = {
      type: 'doc',
      content: [],
    };
    let tiptapParagraph: TiptapParagraph = {
      type: 'paragraph',
      content: [],
      attrs: {
        speakerId: defaultSpeaker,
      },
    };

    words.forEach((word, i) => {
      if (word.startParagraph && i !== 0) {
        tiptapDocument.content.push(tiptapParagraph);
        tiptapParagraph = {
          type: 'paragraph',
          content: [],
          attrs: {},
        };
      }
      tiptapParagraph.content.push({
        type: 'text',
        text:
          tiptapParagraph.content.length === 0
            ? word.text.trimStart()
            : word.text,
        marks: [
          {
            type: 'word',
            // attrs: { timestamp: word.start, confidence: word.confidence },
            attrs: {
              start: word.start,
              end: word.end,
              confidence: word.confidence,
            },
          },
        ],
      });
    });
    tiptapDocument.content.push(tiptapParagraph);
    return tiptapDocument;
  }

  public async getTiptapDocument(
    transcriptionId: string,
  ): Promise<TiptapDocument> {
    const connection = await this.hocuspocusService.openDirectConnection(
      transcriptionId,
    );

    const document = this.docToJSON(connection.document);
    connection.disconnect();

    return document;
  }

  private docToJSON(doc: Y.Doc): TiptapDocument {
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

  private docToWordList(doc: Y.Doc): WordEntity[] {
    const data = this.docToJSON(doc);
    const words: WordEntity[] = [];
    for (const paragraph of data.content) {
      for (let i = 0; i < paragraph.content.length; i++) {
        const word = paragraph.content[i];
        words.push({
          text: word.text,
          start: word.marks[0]?.attrs.start,
          end: word.marks[0]?.attrs.end,
          startParagraph: i === 0,
          confidence: word.marks[0]?.attrs.confidence,
          speakerId: paragraph.attrs.speakerId ?? null,
        });
      }
    }
    return words;
  }

  async getPlainText(transcriptionId: string) {
    const connection = await this.hocuspocusService.openDirectConnection(
      transcriptionId,
    );
    const words = this.docToWordList(connection.document);
    connection.disconnect();
    return words.map((word) => word.text.trim()).join(' ');
  }

  async getCaptionsById(transcriptionId: string): Promise<TiptapCaption[]> {
    const connection = await this.hocuspocusService.openDirectConnection(
      transcriptionId,
    );

    const captions = this.getCaptions(connection.document);
    connection.disconnect();
    return captions;
  }

  getCaptions(doc: Y.Doc): TiptapCaption[] {
    const MIN_CHARACTERS = 40;
    const MAX_CHARACTERS = 80;
    const MAX_SILENCE = 5000;
    const SENTENCE_ENDING_CHARACTERS = ['.', ';', '!', '?'];
    const DEFAULT_WORD_DURATION = 1000;

    const isNewCaptionStarting = (
      caption: TiptapCaption,
      word: WordEntity,
    ): boolean => {
      if (word.start === 0) {
        return false;
      }

      if (word.startParagraph) {
        return true;
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

    const captions: TiptapCaption[] = [];

    let id = 1;
    let currentCaption: TiptapCaption = {
      id: id.toString(),
      start: 0,
      text: '',
      end: 0,
      speakerId: null,
      startParagraph: true,
    };

    for (const word of wordList) {
      if (isNewCaptionStarting(currentCaption, word)) {
        // End caption
        currentCaption.end = word.start;
        if (currentCaption.text.length > 0) captions.push(currentCaption);

        // Start new caption
        id++;
        currentCaption = {
          id: id.toString(),
          start: word.start,
          text: word.text,
          end: 0,
          speakerId: word.speakerId,
          startParagraph: word.startParagraph,
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
