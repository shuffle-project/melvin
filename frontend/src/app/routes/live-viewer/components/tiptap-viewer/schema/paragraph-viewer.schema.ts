import { Injector } from '@angular/core';
import { mergeAttributes, Node } from '@tiptap/core';
import Paragraph from '@tiptap/extension-paragraph';
import { AngularNodeViewRenderer } from 'ngx-tiptap';
import { TiptapParagraphViewerComponent } from '../tiptap-paragraph-viewer/tiptap-paragraph-viewer.component';

export const CustomParagraphViewer = (injector: Injector): Node => {
  return Paragraph.extend({
    addAttributes() {
      return {
        speakerId: {
          default: null,
          parseHTML: (element) => {
            return element.getAttribute('data-speaker-id');
          },
          renderHTML: (attributes) => {
            return {
              'data-speaker-id': attributes['speakerId'],
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
      return AngularNodeViewRenderer(TiptapParagraphViewerComponent, {
        injector,
      });
    },
  });
};
