import { Injector } from '@angular/core';
import { Mark, mergeAttributes } from '@tiptap/core';
import { TiptapEditorService } from '../tiptap-editor.service';

export const CustomWord = (injector: Injector) =>
  Mark.create({
    name: 'word',
    exitable: true,
    spanning: false,
    whitespace: 'normal',

    addAttributes() {
      return {
        start: {
          default: undefined,
          parseHTML: (element) => {
            return element.getAttribute('data-start');
          },
          renderHTML(attributes) {
            return {
              'data-start': attributes['start'],
            };
          },
        },
        end: {
          default: undefined,
          parseHTML: (element) => {
            return element.getAttribute('data-end');
          },
          renderHTML(attributes) {
            return {
              'data-end': attributes['end'],
            };
          },
        },
        modifiedAt: {
          default: undefined,
          parseHTML: (element) => {
            return element.getAttribute('data-modified-at');
          },
          renderHTML(attributes) {
            return {
              'data-modified-at': attributes['modifiedAt'],
            };
          },
        },
        modifiedBy: {
          default: undefined,
          parseHTML: (element) => {
            return element.getAttribute('data-modified-by');
          },
          renderHTML(attributes) {
            return {
              'data-modified-by': attributes['modifiedBy'],
            };
          },
        },
        confidence: {
          default: undefined,
          parseHTML: (element) => {
            return element.getAttribute('data-confidence');
          },
          renderHTML: (attributes) => {
            return {
              'data-confidence': attributes['confidence'],
            };
          },
        },
      };
    },

    parseHTML() {
      return [
        {
          tag: 'span',
        },
      ];
    },

    renderHTML({ HTMLAttributes }) {
      const attrs: any = {};

      // Colorise modified words
      const modifiedBy = HTMLAttributes['data-modified-by'];
      if (modifiedBy) {
        const tiptapEditorService = injector.get(TiptapEditorService);
        const color = tiptapEditorService.getUserColor(modifiedBy);
        attrs.style = `color: rgb(var(--color-editor-user-${color}-rgb))`;
      }

      // Render timestamp classes for highlighting currently spoken words
      const start = HTMLAttributes['data-start'];
      const end = HTMLAttributes['data-end'];

      if (start != undefined) {
        const timeStart = Math.floor(start);
        const timeEnd = Math.floor(end ?? start);
        const classes = new Array(timeEnd - timeStart + 1)
          .fill(0)
          .map((_, i) => `time-${timeStart + i}`);
        attrs.class = classes.join(' ');
      }

      return ['span', mergeAttributes(HTMLAttributes, attrs), 0];
    },
  });