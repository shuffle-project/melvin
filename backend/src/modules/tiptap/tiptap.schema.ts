import { Mark, mergeAttributes } from '@tiptap/core';
import Paragraph from '@tiptap/extension-paragraph';

export const Word = Mark.create({
  name: 'word',
  exitable: true,
  spanning: false,

  addAttributes() {
    return {
      start: {
        default: undefined,
        renderHTML(attributes) {
          return { 'data-start': attributes['start'] };
        },
      },
      end: {
        default: undefined,
        renderHTML(attributes) {
          return { 'data-end': attributes['end'] };
        },
      },
      modifiedAt: {
        default: undefined,
        renderHTML(attributes) {
          return {
            'data-modified-at': attributes['modifiedAt'],
          };
        },
      },
      modifiedBy: {
        default: undefined,
        renderHTML(attributes) {
          return {
            'data-modified-by': attributes['modifiedBy'],
          };
        },
      },
      confidence: {
        default: undefined,
        renderHTML(attributes) {
          return {
            'data-confidence': attributes['confidence'],
          };
        },
      },
      isTimestampInterpolated: {
        default: undefined,
        renderHTML: (attributes) => {
          return {
            'data-timestamp-interpolated': attributes['timestamp-interpolated'],
          };
        },
      },
    };
  },

  parseHTML(): any {
    return [
      {
        tag: 'span',
      },
      {
        class: 'word',
        modifiedAt: 'data-modified-at',
        modifiedBy: 'data-modified-by',
        confidence: 'data-confidence',
        start: 'data-start',
        end: 'data-end',
        timestampInterpolated: 'data-timestamp-interpolated',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
});
export const Partial = Mark.create({
  name: 'partial',
  exitable: true,
  spanning: false,
  addAttributes() {
    return {
      isPartial: {
        default: true,
        renderHTML(attributes) {
          return {
            'is-partial': attributes['isPartial'],
          };
        },
      },
      contenteditable: {
        default: false,
        renderHTML(attributes) {
          return {
            contenteditable: attributes['contenteditable'],
          };
        },
      },

      timestamp: {
        default: undefined,
        renderHTML(attributes) {
          return {
            'data-timestamp': attributes['timestamp'],
          };
        },
      },
    };
  },

  parseHTML(): any {
    return [
      {
        tag: 'em',
      },
      {
        class: 'partial',
        isPartial: 'is-partial',
        contenteditable: 'contenteditable',
        timestamp: 'timestamp',
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['em', mergeAttributes(HTMLAttributes), 0];
  },
});

export const CustomParagraph = Paragraph.extend({
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
});
