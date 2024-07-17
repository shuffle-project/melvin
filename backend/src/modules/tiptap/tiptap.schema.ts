import { Mark, mergeAttributes } from '@tiptap/core';

export const Word = Mark.create({
  name: 'word',
  exitable: true,
  spanning: false,

  addAttributes() {
    return {
      timestamp: {
        default: undefined,
        renderHTML(attributes) {
          return {
            'data-timestamp': attributes['timestamp'],
          };
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
        timestamp: 'timestamp',
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
