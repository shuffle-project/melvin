import { Injector } from '@angular/core';
import { Editor, Extension } from '@tiptap/core';
import { Schema } from '@tiptap/pm/model';
import { Plugin, PluginKey, Transaction } from '@tiptap/pm/state';

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
    // Replace selection of spaces with a single space
    if (from !== to && tr.doc.textBetween(from, to).trim() === '') {
      return false;
    }

    // Add a space between two words, cursor has no selection
    if (
      from === to &&
      (hasLeadingSpace(tr, from) || hasTrailingSpace(tr, to))
    ) {
      return false;
    }

    if (!hasLeadingSpace(tr, from)) {
      setPreviousWordAsModified(userId, schema, tr, from);
    }
    if (!hasTrailingSpace(tr, to)) {
      setNextWordAsModified(userId, schema, tr, to);
    }
    dispatch(tr);

    return false;
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

      tr.insert(
        from,
        schema.text(text, [
          schema.marks['word'].create({
            ...(attrs ?? {}),
            modifiedAt: new Date().toISOString(),
            modifiedBy: userId,
          }),
        ])
      );
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
              console.log(this.options.userId);

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
              if (event.metaKey) {
                return;
              }

              const { tr, schema } = view.state;

              let from = tr.selection.ranges[0].$from.pos;
              let to = tr.selection.ranges[0].$to.pos;

              if (event.code === 'Enter' && !event.composed) {
                if (hasLeadingSpace(tr, from) || hasTrailingSpace(tr, to)) {
                  return false;
                }
                if (!hasLeadingSpace(tr, from)) {
                  setPreviousWordAsModified(
                    this.options.userId,
                    schema,
                    tr,
                    from
                  );
                }
                if (!hasTrailingSpace(tr, to)) {
                  setNextWordAsModified(this.options.userId, schema, tr, to);
                }
                view.dispatch(tr);
                return false;
              }

              if (event.code === 'Delete') {
                return handleInsert(
                  this.options.userId,
                  this.editor,
                  from,
                  from === to ? to + 1 : to,
                  ''
                );
              }

              if (event.code === 'Backspace') {
                return handleInsert(
                  this.options.userId,
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
            handleDrop: (view, event, slice, moved) => {
              return true;
            },
          },
        }),
      ];
    },
  });
