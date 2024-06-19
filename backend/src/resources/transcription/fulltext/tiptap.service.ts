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
  async exportDocument(doc: Y.Doc): Promise<any> {
    this.logger.verbose('exportDocument');

    const pmDocJSON = TiptapTransformer.fromYdoc(doc, 'default');

    const docNode = this.schema.nodeFromJSON(pmDocJSON);
    const editorState = EditorState.create({
      schema: this.schema,
      doc: docNode,
    });

    const docJSON = editorState.doc.toJSON();

    // Filter out empty paragraphs
    docJSON.content = docJSON.content.filter(
      (paragraph) => paragraph.content && paragraph.content.length > 0,
    );

    // If the document is empty after filtering out empty paragraphs, return early
    if (docJSON.content.length === 0) {
      return {
        message: 'Document is empty, no export was made.',
      };
    }

    const docContentString = JSON.stringify(docJSON, null, 2);

    // writeFileSync(`${stringID}.json`, docContentString);

    return docContentString;
  }

  async importDocument(doc: Y.Doc, jsonDoc: any): Promise<Y.Doc> {
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

    // Return the document or do something with it
    return doc;
  }
}
