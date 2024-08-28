import { Injector } from '@angular/core';
import { mergeAttributes, Node } from '@tiptap/core';
import Paragraph from '@tiptap/extension-paragraph';
import { AngularNodeViewRenderer } from 'ngx-tiptap';
import { TiptapParagraphComponent } from '../tiptap-paragraph/tiptap-paragraph.component';

export const CustomParagraph = (injector: Injector): Node => {
  return Paragraph.extend({
    addAttributes() {
      return {
        speaker: {
          default: null,
          parseHTML: (element) => {
            return element.getAttribute('data-speaker');
          },
          renderHTML: (attributes) => {
            return {
              'data-speaker': attributes['speaker'],
            };
          },
        },
      };
    },
    parseHTML() {
      return [{ tag: 'p' }];
    },
    renderHTML({ HTMLAttributes }) {
      return ['p', mergeAttributes(HTMLAttributes), 0];
    },
    addNodeView() {
      return AngularNodeViewRenderer(TiptapParagraphComponent, { injector });
    },
  });
};
