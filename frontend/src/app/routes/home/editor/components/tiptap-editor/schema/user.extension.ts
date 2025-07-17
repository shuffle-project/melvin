import { Injector } from '@angular/core';
import { Editor, Extension } from '@tiptap/core';
import { Schema } from '@tiptap/pm/model';
import { Plugin, PluginKey, Transaction } from '@tiptap/pm/state';
import { TiptapEditorService } from '../tiptap-editor.service';

const addModifiedMarksAt = (
  userId: string,
  schema: Schema,
  tr: Transaction,
  start: number,
  end: number
) => {
  tr.doc.nodesBetween(start, end, (node, pos) => {
    if (node.type.name === 'text') {
      const attrs = node.marks.find((o) => o.type.name === 'word')?.attrs ?? {};

      tr.addMark(
        pos,
        pos + node.textContent.length,
        schema.marks['word'].create({
          ...attrs,
          modifiedAt: new Date().toISOString(),
          modifiedBy: userId,
        })
      );
    }
  });
};

// getpreviousword range?
// getnextword

const setPreviousWordAsModified = (
  userId: string,
  schema: Schema,
  tr: Transaction,
  pos: number
) => {
  const end = pos;
  let start = pos;
  while (start > 0 && !/\s/.test(tr.doc.textBetween(start - 1, end))) {
    start--;
  }
  addModifiedMarksAt(userId, schema, tr, start, end);
};

const setNextWordAsModified = (
  userId: string,
  schema: Schema,
  tr: Transaction,
  pos: number
) => {
  const start = pos;
  let end = pos;
  while (
    end < tr.doc.textContent.length &&
    !/\s/.test(tr.doc.textBetween(start, end + 1))
  ) {
    end++;
  }
  addModifiedMarksAt(userId, schema, tr, start, end);
};

const hasLeadingSpace = (tr: Transaction, pos: number) => {
  if (tr.doc.nodeAt(pos - 1)?.type.name === 'paragraph') {
    return true;
  }
  return tr.doc.textBetween(pos - 1, pos) === ' ';
};

const hasTrailingSpace = (tr: Transaction, pos: number) => {
  if (tr.doc.nodeAt(pos + 1)?.type.name === 'paragraph') {
    return true;
  }
  return tr.doc.textBetween(pos, pos + 1) === ' ';
};

const getWordsBetween = (tr: Transaction, from: number, to: number) => {
  const words: Array<{ pos: number; text: string; attributes: any }> = [];

  tr.doc.nodesBetween(from, to, (node, pos) => {
    if (node.type.name === 'text') {
      const word = { pos, text: node.textContent, attributes: {} };
      node.marks.forEach((mark) => {
        if (mark.type.name === 'word') {
          Object.assign(word.attributes, mark.attrs);
        }
      });
      words.push(word);
    }
  });

  return words;
};

const handleSpace = (
  userId: string,
  editor: Editor,
  from: number,
  to: number
) => {
  const { tr, schema } = editor.state;
  const { dispatch } = editor.view;

  // Replace selection of spaces with a single space
  if (from !== to && tr.doc.textBetween(from, to).trim() === '') {
    return false;
  }

  // Add a space between two words, cursor has no selection
  if (from === to && (hasLeadingSpace(tr, from) || hasTrailingSpace(tr, to))) {
    return false;
  }

  if (!hasLeadingSpace(tr, from)) {
    setPreviousWordAsModified(userId, schema, tr, from);
  }
  if (!hasTrailingSpace(tr, to)) {
    setNextWordAsModified(userId, schema, tr, to);
  }

  const wordsBetween = getWordsBetween(tr, from, to);

  if (wordsBetween.length === 1) {
    // selection range or cursor is only one word -> split it and add a space
    const word = wordsBetween[0];
    const nodeAt = tr.doc.nodeAt(from);
    const mark = nodeAt!.marks[0];
    const offset = from - word.pos;

    const part1 = schema.text(word.text.slice(0, offset), [
      schema.mark('word', {
        ...mark.attrs,
      }),
    ]);

    // slice word, add to-from if the selection is a range
    const part2 = schema.text(
      ' ' + word.text.slice(0 + offset + to - from, word.text.length),
      [
        schema.mark('word', {
          ...mark.attrs,
        }),
      ]
    );

    tr.delete(word.pos, word.pos + word.text.length);
    tr.insert(word.pos, [part1, part2]);
  } else {
    // its a range / multple words, first delete everything in the selection and add a space
    // no splitting needed since you always selected multiple/spitted words
    tr.deleteRange(from, to);

    const nodeAt = tr.doc.nodeAt(from);
    if (nodeAt) {
      tr.insertText(' ' + nodeAt.text, from, from + nodeAt.nodeSize);
    } else {
      tr.insertText(' ', from);
    }
  }

  dispatch(tr);

  editor.commands.focus(from + 1);

  return true;
};

const getTextNodeBefore = (tr: Transaction, from: number) => {
  if (from === 0) return null;

  const nodeBefore = tr.doc.nodeAt(from - 1);
  if (nodeBefore === null || nodeBefore?.type.name === 'paragraph') {
    return getTextNodeBefore(tr, from - 1);
  } else {
    return nodeBefore;
  }
};

const getTextNodeAfter = (tr: Transaction, to: number) => {
  if (to === tr.doc.content.size) return null;

  const nodeBefore = tr.doc.nodeAt(to + 1);
  if (nodeBefore === null || nodeBefore?.type.name === 'paragraph') {
    return getTextNodeBefore(tr, to + 1);
  } else {
    return nodeBefore;
  }
};

const handleInsert = (
  userId: string,
  editor: Editor,
  from: number,
  to: number,
  text: string
): boolean => {
  const { tr, schema } = editor.state;
  const { dispatch } = editor.view;

  const deletedText = tr.doc.textBetween(from, to);

  // Deleted a paragraph
  if (text.length === 0 && deletedText.length === 0) {
    return false;
  }

  // Handle Space
  if (text.length > 0 && text.trim() === '') {
    return handleSpace(userId, editor, from, to);
  }

  // New word
  if (
    (hasLeadingSpace(tr, from) || text.startsWith(' ')) &&
    (hasTrailingSpace(tr, to) ||
      text.endsWith(' ') ||
      to === tr.doc.content.size - 1)
  ) {
    if (text.length > 0) {
      let attrs: any;
      if (tr.doc.textBetween(from, to).trim() !== '') {
        // Keep timestamps of first word of selection
        tr.doc.nodesBetween(from, to, (node, pos) => {
          if (!attrs && node.type.name === 'text') {
            node.marks.forEach((mark) => {
              if (mark.type.name === 'word' && mark.attrs['start']) {
                attrs = mark.attrs;
              }
            });
          }
        });
      }

      tr.delete(from, to);

      const nodeAtBefore = getTextNodeBefore(tr, from);
      const nodeAtAfter = getTextNodeAfter(tr, to + 1);

      // get wordBefore bis ein wort gefunden wurde oder 0
      // get wordAfter bis ein wort gefunden wurde oder doc.content.size

      const startBefore = nodeAtBefore?.marks[0]?.attrs['start'];
      const endBefore = nodeAtBefore?.marks[0]?.attrs['end'];
      const startAfter = nodeAtAfter?.marks[0]?.attrs['start'];
      const endAfter = nodeAtAfter?.marks[0]?.attrs['end'];

      // console.log(nodeAtBefore, nodeAtAfter);
      const start = startBefore ?? startAfter ?? 0;
      const end = startAfter ?? endBefore ?? 0;

      const createdMark = schema.marks['word'].create({
        start: start,
        end: end,
        ...(attrs ?? {}),
        modifiedAt: new Date().toISOString(),
        modifiedBy: userId,
        isTimestampInterpolated: true,
      });

      tr.insert(from, schema.text(text, [createdMark]));
    } else {
      tr.delete(from, to);
    }

    editor.commands.focus(from);
    dispatch(tr);

    return true;
  }

  // Add to previous word
  if (hasTrailingSpace(tr, to)) {
    if (text.length === 0) {
      if (deletedText.trim().length === 0) {
        return false;
      }
      const words = getWordsBetween(tr, from, to);
      if (words[0]?.text.trim() === '') {
        return false;
      }
    }

    setPreviousWordAsModified(userId, schema, tr, from);
    tr.insertText(text, from, to);
    dispatch(tr);
    return true;
  }

  // Add to next word
  if (hasLeadingSpace(tr, from)) {
    if (text.length === 0) {
      if (deletedText.trim().length === 0) {
        return false;
      }
      const words = getWordsBetween(tr, from, to);
      if (words.at(-1)?.text.trim() === '') {
        return false;
      }
    }

    tr.insertText(text, from, to);
    setNextWordAsModified(userId, schema, tr, from);
    dispatch(tr);
    return true;
  }

  // Add to current word
  setPreviousWordAsModified(userId, schema, tr, from);
  setNextWordAsModified(userId, schema, tr, to);
  tr.insertText(text, from, to);
  dispatch(tr);
  return true;
};

export const UserExtension = (injector: Injector) =>
  Extension.create({
    name: 'userExtension',

    addOptions() {
      return {
        userId: null,
      };
    },

    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey('autoColor'),
          props: {
            handleKeyPress: (view, event) => {
              const { tr } = view.state;
              const from = tr.selection.ranges[0].$from.pos;
              const to = tr.selection.ranges[0].$to.pos;
              const text = event.code === 'Space' ? ' ' : event.key;

              return handleInsert(
                this.options.userId,
                this.editor,
                from,
                to,
                text
              );
            },
            handleKeyDown: (view, event) => {
              console.log('handleKeyDown', event);

              // if (event.ctrlKey && event.key === 'Enter') {
              //   console.log('ctrl+enter');
              //   return false;
              // }

              // if (event.ctrlKey && event.altKey && event.key === 'Enter') {
              //   console.log('ctrl+alt+enter');
              //   return false;
              // }

              if (event.metaKey) {
                return;
              }

              const { tr, schema } = view.state;
              const userId = this.options.userId;

              let from = tr.selection.ranges[0].$from.pos;
              let to = tr.selection.ranges[0].$to.pos;

              if (event.code === 'Enter') {
                if (!event.composed) {
                  if (hasLeadingSpace(tr, from) || hasTrailingSpace(tr, to)) {
                    return false;
                  }
                  if (!hasLeadingSpace(tr, from)) {
                    setPreviousWordAsModified(userId, schema, tr, from);
                  }
                  if (!hasTrailingSpace(tr, to)) {
                    setNextWordAsModified(userId, schema, tr, to);
                  }
                  view.dispatch(tr);
                  return false;
                } else {
                  tr.split(from);
                  tr.setNodeAttribute(from + 1, 'speaker', null);
                  setPreviousWordAsModified(userId, schema, tr, from);
                  setNextWordAsModified(userId, schema, tr, to);

                  view.dispatch(tr);

                  return true;
                }
              }

              if (event.code === 'Delete') {
                return handleInsert(
                  userId,
                  this.editor,
                  from,
                  from === to ? to + 1 : to,
                  ''
                );
              }

              if (event.code === 'Backspace') {
                return handleInsert(
                  userId,
                  this.editor,
                  from === to ? from - 1 : from,
                  to,
                  ''
                );
              }

              // Other key
              return;
            },
            handlePaste: (view, event, slice) => {
              const { tr } = view.state;

              const from = tr.selection.ranges[0].$from.pos;
              const to = tr.selection.ranges[0].$to.pos;
              const text = slice.content.textBetween(0, slice.content.size);

              return handleInsert(
                this.options.userId,
                this.editor,
                from,
                to,
                text
              );
            },
            handleClickOn(view, pos, node, nodePos, event, direct) {
              injector.get(TiptapEditorService).clickWord(event);
            },
            handleDrop: (view, event, slice, moved) => {
              return true;
            },
          },
        }),
      ];
    },
  });
