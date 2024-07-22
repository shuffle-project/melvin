import { Extension, Mark, mergeAttributes } from '@tiptap/core';
import Paragraph from '@tiptap/extension-paragraph';
import { Plugin, PluginKey } from 'prosemirror-state';

export const CustomParagraph = Paragraph.extend({
  addAttributes() {
    return {
      speaker: {
        default: null,
      },
    };
  },
});

// export const Highlight = Extension.create({
//   name: 'highlight',
//   addStorage() {
//     return {
//       currentTime: 0,
//     };
//   },

//   // setCurrentTime: (currentTime: number) => {
//   //   // @ts-ignore
//   //   this.storage['currentTime'] = currentTime;
//   // },

//   addCommands(): any {
//     return {
//       setCurrentTime: (currentTime: number) => (test: any) => {
//         this.storage.currentTime = currentTime;

//         console.log(test);
//         return test.commands.updateAttributes('word', { bold: true });
//         // console.log(this.options, this.storage);
//         // return this.options.types
//         //   .map((type: any) =>
//         //     test.commands.updateAttributes(type, { currentTime })
//         //   )
//         //   .every((response: any) => response);
//       },
//     };
//   },

//   addGlobalAttributes() {
//     return [
//       {
//         // Extend the following extensions
//         types: ['word'],
//         // … with those attributes
//         attributes: {
//           currentTime: {
//             default: 0,
//             renderHTML: (attributes) => {
//               console.log(this, attributes);
//               if (
//                 attributes['timestamp'] &&
//                 attributes['timestamp'] < this.storage['currentTime']
//               ) {
//                 return { style: `font-weight: bold` };
//               } else {
//                 return {};
//               }
//             },
//             // parseHTML: (element) => element.style.textAlign || 'left',
//           },
//         },
//       },
//     ];
//   },
// });

export const Word = Mark.create({
  name: 'word',
  exitable: true,
  spanning: false,

  // addStorage() {
  //   return { currentTime: 0 };
  // },
  // setTime(time: number) {
  //   this['storage'].currentTime = time;
  // },

  // addGlobalAttributes() {
  //   return [{ attributes: {} }];
  // },

  addAttributes() {
    return {
      // timestamp: {
      //   default: undefined,
      //   renderHTML(attributes) {
      //     const timestamp = attributes['timestamp'];
      //     if (timestamp !== undefined) {
      //       const timevalue = Math.floor(timestamp / 1000);
      //       return {
      //         'data-timestamp': attributes['timestamp'],
      //         class: `time-${timevalue}`,
      //       };
      //     } else {
      //       return {
      //         'data-timestamp': attributes['timestamp'],
      //       };
      //     }
      //   },
      // },
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
      color: {
        default: undefined,
        renderHTML(attributes) {
          if (!attributes['color']) {
            return {};
          }
          return {
            style: `color: var(--color-editor-user-${attributes['color']})`,
          };
        },
      },
      // highlight: {
      //   default: false,
      //   renderHTML: (attributes) => {
      //     return {
      //       style: `font-weight: ${
      //         attributes['highlight'] ? 'bold' : 'normal'
      //       }`,
      //     };
      //   },
      // },
      // highlight: {
      //   default: false,
      //   renderHTML: (attributes) => {
      //     console.log(this, attributes);
      //     if (
      //       attributes['timestamp'] &&
      //       // @ts-ignore
      //       attributes['timestamp'] < this['storage'].currentTime
      //     ) {
      //       return { style: 'font-weight: bold;' };
      //     } else {
      //       return {};
      //     }
      //   },
      // },
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
        start: 'data-start',
        end: 'data-end',
        color: 'color',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    if (HTMLAttributes['data-start'] !== undefined) {
      let start = Math.floor(HTMLAttributes['data-start'] / 1000);
      const end =
        HTMLAttributes['data-end'] !== undefined
          ? Math.floor(HTMLAttributes['data-end'] / 1000)
          : start;

      const classes: string[] = [];
      while (start <= end) {
        classes.push(`time-${start}`);
        start++;
      }

      HTMLAttributes = mergeAttributes(HTMLAttributes, {
        class: classes.join(' '),
      });
    }
    return ['span', HTMLAttributes, 0];
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
      userId: null,
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
            console.log(text);
            tr.addMark(
              from,
              from + text.length,
              schema.marks['word'].create({
                modifiedBy: this.options.userId,
                modifiedAt: new Date().toISOString(),
                color: this.options.color,
              })
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
              tr.addMark(
                startPos,
                endPos,
                schema.marks['word'].create({
                  modifiedBy: this.options.userId,
                  modifiedAt: new Date().toISOString(),
                  color: this.options.color,
                })
              );
            }
            dispatch(tr);
            return true;
          },

          handleClickOn: (view, pos) => {
            //get the node at the position
            const clickedNode = view.state.doc.nodeAt(pos);

            let divToInsert = document.getElementById('overViewOnClick');
            if (divToInsert) divToInsert.innerHTML = '';
            if (clickedNode) {
              clickedNode.marks.forEach((mark) => {
                console.log(mark.attrs);
                // if (!divToInsert) {
                //   divToInsert = document.createElement('div');
                //   divToInsert.id = 'overViewOnClick';
                //   document.body.appendChild(divToInsert);
                // }
                // if (mark.type.name === 'word') {
                //   divToInsert.innerHTML += `<div>Modified by: ${mark.attrs['modifiedBy']}</div><div>Modified at: ${mark.attrs['modifiedAt']}</div> <div>Timestamp: ${mark.attrs['timestamp']}</div>`;
                // }
                // if (mark.type.name === 'textStyle') {
                //   divToInsert.innerHTML += `<div>Color: ${mark.attrs['color']}</div>`;
                // }
              });
              return true; // Consume the event
            } else return false; // Let the event bubble up
          },
        },
      }),
    ];
  },
});

// const CurrentTimeExtension = Extension.create({
//   name: 'currentTimeExtension',

//   addStorage() {
//     return { currentTime: 0 };
//   },
//   setTime(time: number) {
//     this['storage'].currentTime = time;
//   },
// });
