import { Injector } from '@angular/core';
import { Mark, mergeAttributes } from '@tiptap/core';
import { TiptapEditorService } from '../tiptap-editor.service';

export const CustomWord = (injector: Injector) => {
  return Mark.create({
    name: 'word',
    exitable: true,
    spanning: false,
    whitespace: 'normal',

    addOptions() {
      return {
        showWordBorders: false,
      };
    },

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
        isTimestampInterpolated: {
          default: undefined,
          parseHTML: (element) => {
            return element.getAttribute('data-timestamp-interpolated');
          },
          renderHTML: (attributes) => {
            return {
              'data-timestamp-interpolated':
                attributes['timestamp-interpolated'],
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
        attrs.style = `text-decoration: underline; text-underline-offset: 0.25rem; color: rgb(var(--color-editor-user-${color}-rgb))`;
      }

      // Render timestamp classes for highlighting currently spoken words
      const start = HTMLAttributes['data-start'];
      const end = HTMLAttributes['data-end'];

      if (start != undefined && end != undefined) {
        const timeStart = Math.floor(start / 1000);
        const timeEnd = Math.floor(end / 1000);
        const classes = new Array(timeEnd - timeStart + 1)
          .fill(0)
          .map((_, i) => `time-${timeStart + i}`);
        attrs.class = classes.join(' ');
      }

      if (this.options.showWordBorders) {
        // debug border, only shows if the debug option is true
        if (!attrs.style) {
          attrs.style =
            'border-left: 1px solid black; border-right: 1px solid black;';
          attrs.style =
            'border-left: 1px solid black; border-right: 1px solid black;';
        } else {
          attrs.style +=
            '; border-left: 1px solid black; border-right: 1px solid black;';
          attrs.style +=
            '; border-left: 1px solid black; border-right: 1px solid black;';
        }
      }

      return ['span', mergeAttributes(HTMLAttributes, attrs), 0];
    },
  });
};
