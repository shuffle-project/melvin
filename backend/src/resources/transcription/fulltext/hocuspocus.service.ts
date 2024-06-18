// hocuspocus.service.ts
import { Database } from '@hocuspocus/extension-database';
import { Hocuspocus } from '@hocuspocus/server';
import { TiptapTransformer } from '@hocuspocus/transformer';
import { Injectable } from '@nestjs/common';
import { getSchema } from '@tiptap/core';
import Color from '@tiptap/extension-color';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import TextStyle from '@tiptap/extension-text-style';
import { IncomingMessage } from 'http';
import { EditorState } from 'prosemirror-state';
import { WebSocket } from 'ws';
import { updateYFragment } from 'y-prosemirror';
import { CustomLogger } from '../../../modules/logger/logger.service';
import { TranscriptionService } from '../transcription.service';
import { Partial, Word } from './tiptap.schema';

@Injectable()
export class HocuspocusService {
  private server: Hocuspocus;

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
  constructor(
    private logger: CustomLogger,
    private transcriptionService: TranscriptionService,
  ) {
    this.init();
  }

  private init() {
    this.server = new Hocuspocus({
      extensions: [
        new Database({
          fetch: async ({ documentName }) =>
            this.transcriptionService.loadYDoc(documentName),
          store: async ({ documentName, state }) =>
            this.transcriptionService.storeYDoc(documentName, state),
        }),
      ],
    });
  }

  handleConnection(
    websocket: WebSocket,
    request: IncomingMessage,
    context: any,
  ) {
    this.logger.log('handle connection');
    this.server.handleConnection(websocket, request, context);
  }

  async insert(transcriptionId: string, text: string) {
    this.logger.verbose('insert');
    const connection = await this.server.openDirectConnection(transcriptionId);

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

  async insertStream() {
    this.logger.verbose('insertStream');

    const connection = await this.server.openDirectConnection(
      'example-document',
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

  async insertPartial() {
    this.logger.verbose('insertPartial');

    const connection = await this.server.openDirectConnection(
      'example-document',
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
}
