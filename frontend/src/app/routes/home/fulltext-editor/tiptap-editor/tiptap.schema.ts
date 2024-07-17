import { Extension, Mark, mergeAttributes } from '@tiptap/core';
import Paragraph from '@tiptap/extension-paragraph';
import { Plugin, PluginKey } from 'prosemirror-state';

export const CustomParagraph = Paragraph.extend({
  addAttributes() {
    return {
      speaker: {
        default: 'Speaker 1',
      },
    };
  },
});

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
        default: () => new Date().toISOString(),
        renderHTML(attributes) {
          return {
            'data-modified-at': attributes['modifiedAt'],
          };
        },
      },
      modifiedBy: {
        default: 'jane.doe',
        renderHTML(attributes) {
          return {
            'data-modified-by': attributes['modifiedBy'],
          };
        },
      },
      color: {
        default: 'black',
        renderHTML(attributes) {
          return {
            color: attributes['color'],
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
        color: 'color',
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
        color: 'color',
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['em', mergeAttributes(HTMLAttributes), 0];
  },
});

export const UserExtension = Extension.create({
  name: 'userExtension',

  addOptions() {
    return {
      color: 'black',
      name: null,
      editor: null,
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('autoColor'),
        props: {
          handleTextInput: (view, from, to, text) => {
            const { state, dispatch } = view;
            const { tr } = state;
            const { schema } = state;

            // Insert the new text
            tr.insertText(text, from, to);
            tr.addMark(
              from,
              from + text.length,
              schema.marks['textStyle'].create({ color: this.options.color })
            );

            const isWordBoundary = /\s|[.,;!?]/.test(text);

            if (isWordBoundary) {
              // Detect the start of the current word
              let startPos = from;
              while (
                startPos > 0 &&
                !/\s/.test(state.doc.textBetween(startPos - 1, startPos))
              ) {
                startPos--;
              }

              const endPos = to;
              if (text.length == 1)
                tr.addMark(
                  startPos,
                  endPos,
                  schema.marks['word'].create({
                    modifiedBy: this.options.name,
                    modifiedAt: new Date().toISOString(),
                    timestamp: new Date().getTime(),
                  })
                );
            }

            if (text.length > 1) {
              let clickedNode = view.state.doc.nodeAt(
                state.selection.$from.pos
              );
              tr.addMark(
                from,
                from + text.length,
                schema.marks['word'].create({
                  modifiedBy: this.options.name,
                  modifiedAt: clickedNode?.marks.find(
                    (mark) => mark.type.name === 'word'
                  )?.attrs['modifiedAt'],
                  timestamp: clickedNode?.marks.find(
                    (mark) => mark.type.name === 'word'
                  )?.attrs['timestamp'],
                })
              );
            }

            dispatch(tr);

            // If text length is greater than 1, handle cursor position
            if (text.length > 1) {
              this.options.editor.commands.setTextSelection(
                state.selection.$from.pos + 1
              );
              this.options.editor.commands.focus();
            }

            return true;
          },

          handleClickOn: (view, pos) => {
            //get the node at the position
            const clickedNode = view.state.doc.nodeAt(pos);

            let divToInsert = document.getElementById('overViewOnClick');
            if (divToInsert) divToInsert.innerHTML = '';
            if (clickedNode) {
              clickedNode.marks.forEach((mark) => {
                if (!divToInsert) {
                  divToInsert = document.createElement('div');
                  divToInsert.id = 'overViewOnClick';
                  document.body.appendChild(divToInsert);
                }
                if (mark.type.name === 'word') {
                  divToInsert.innerHTML += `<div>Modified by: ${mark.attrs['modifiedBy']}</div><div>Modified at: ${mark.attrs['modifiedAt']}</div> <div>Timestamp: ${mark.attrs['timestamp']}</div>`;
                }
                if (mark.type.name === 'textStyle') {
                  divToInsert.innerHTML += `<div>Color: ${mark.attrs['color']}</div>`;
                }
              });
              return true; // Consume the event
            } else return false; // Let the event bubble up
          },
        },
      }),
    ];
  },
});
