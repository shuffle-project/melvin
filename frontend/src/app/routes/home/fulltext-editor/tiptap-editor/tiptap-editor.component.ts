import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { Editor } from '@tiptap/core';
import { Bold } from '@tiptap/extension-bold';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Color from '@tiptap/extension-color';
import Document from '@tiptap/extension-document';
import FloatingMenu from '@tiptap/extension-floating-menu';
import Focus from '@tiptap/extension-focus';
import { Italic } from '@tiptap/extension-italic';
import Text from '@tiptap/extension-text';
import TextStyle from '@tiptap/extension-text-style';

import {
  BehaviorSubject,
  Observable,
  Subject,
  combineLatest,
  filter,
  takeUntil,
} from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { EditorUser } from '../../../../interfaces/editor-user.interface';
import { MediaService } from '../../editor/services/media/media.service';
import { CustomParagraph, Partial, UserExtension, Word } from './tiptap.schema';

enum CLIENT_STATUS {
  CONNECTING,
  CONNECTED,
  AUTHENTICATED,
  SYNCED,
  DISCONNECTED,
}

@Component({
  selector: 'app-tiptap-editor',
  standalone: true,
  imports: [MatIconButton, MatIcon, MatCheckbox, FormsModule],
  templateUrl: './tiptap-editor.component.html',
  styleUrl: './tiptap-editor.component.scss',
})
export class TiptapEditorComponent implements AfterViewInit, OnInit {
  @Input({ required: true }) transcriptionId$!: Observable<string>;
  @Input({ required: true }) activeUsers!: EditorUser[];

  @ViewChild('editor', { static: true }) editorRef!: ElementRef;

  private destroy$$ = new Subject<void>();
  private viewReady$ = new BehaviorSubject(false);

  private provider!: HocuspocusProvider;
  private editor?: Editor;

  public CLIENT_STATUS = CLIENT_STATUS;
  public status: CLIENT_STATUS = CLIENT_STATUS.CONNECTING;

  public isShowingUsername = true;
  // public connectedUsers: { name: string; color: string }[] = [];
  public showUsernames = true;
  private captions: HTMLDivElement | undefined;
  // private awareness: HocuspocusProvider['awareness'] = null;
  private newWordsCount = 0;
  private lastWordCount = 0;

  shouldShow = false;

  public currentTime$ = this.mediaService.currentTime$;

  constructor(private mediaService: MediaService) {}

  ngOnInit() {
    combineLatest([this.viewReady$, this.transcriptionId$])
      .pipe(
        filter(([viewReady, transcriptionId]) => viewReady && !!transcriptionId)
      )
      .pipe(takeUntil(this.destroy$$))
      .subscribe(([_, transcriptionId]) => {
        if (this.provider) {
          this.destroyConnection();
        }
        if (this.editor) {
          this.destroyEditor();
        }
        this.initConnection(transcriptionId);
        this.initEditor();
      });

    this.currentTime$.pipe(takeUntil(this.destroy$$)).subscribe((time) => {
      // @ts-ignore
      // Highlight.setCurrentTime(time);
      // Word.child?.storage.setTime(time);
      // console.log('currentTime', time);
      // this.checkForTimestamp();
      // this.editor?.commands.setCurrentTime(time);
      // this.updateTimestamp(time);

      const timeValue = Math.floor(time / 1000);
      for (let index = 0; index < document.styleSheets.length; index++) {
        const styleSheet = document.styleSheets[index];

        if (styleSheet.title === 'tiptap-timestamp') {
          for (let index = 0; index < styleSheet.cssRules.length; index++) {
            // const rule = element.cssRules[index];
            styleSheet.deleteRule(index);
          }

          styleSheet.insertRule(`.time-${timeValue} { font-weight:bold; }`, 0);
        }
      }

      //remove old classes
      // for (const className of this.editorRef.nativeElement.classList) {
      //   if (className.startsWith('time-')) {
      //     console.log('remove class', className);
      //     // this.editorRef.nativeElement.classList.remove(className);
      //   }
      // }
      //add new class
      // this.editorRef.nativeElement.classList.add(`time-${timeValue}`);
    });
  }

  ngAfterViewInit() {
    this.viewReady$.next(true);
  }

  initConnection(transcriptionId: string) {
    this.provider = new HocuspocusProvider({
      url: environment.hocuspocusUrl, // wss://melvin-server-dummy.onrender.com
      name: transcriptionId,
      onStatus: (status) => {
        console.log('onStatus');
        if (status.status.toString() === 'connecting')
          console.log('Connecting to server...');
        this.status = CLIENT_STATUS.CONNECTING;
      },
      onConnect: () => {
        console.log('onConnect');
        this.status = CLIENT_STATUS.CONNECTED;
      },
      onAuthenticated: () => {
        console.log('onAuthenticated');
        this.status = CLIENT_STATUS.AUTHENTICATED;
      },
      onSynced: () => {
        console.log('onSynced');
        this.status = CLIENT_STATUS.SYNCED;
      },
    });
    // this.onToggleUsernames();
  }

  destroyConnection() {
    this.provider.destroy();
  }

  initEditor() {
    this.captions = document.getElementById('captions') as HTMLDivElement;

    const user = this.activeUsers[0];

    this.editor = new Editor({
      element: this.editorRef.nativeElement,
      extensions: [
        Document,
        CustomParagraph,
        Text,
        TextStyle,
        Focus,
        Color,
        Word,
        Partial,
        FloatingMenu.configure({
          shouldShow: () => this.shouldShow,
          element: document.querySelector('.menu') as HTMLElement,
        }),

        UserExtension.configure({
          color: user.color,
          name: user.name,
          editor: this.editor,
          userId: user.id,
        }),
        Collaboration.configure({
          document: this.provider.document,
        }),
        CollaborationCursor.configure({
          provider: this.provider,
          render: (user) => {
            // render function taken from collaboration-cursor extension
            // https://github.com/ueberdosis/tiptap/blob/main/packages/extension-collaboration-cursor/src/collaboration-cursor.ts
            const cursor = document.createElement('span');
            cursor.classList.add('collaboration-cursor__caret');
            cursor.setAttribute('style', `border-color: ${user['color']}`);

            // edit: only render username lables if showUsernames is true
            if (this.showUsernames) {
              const label = document.createElement('div');
              label.classList.add('collaboration-cursor__label');
              label.setAttribute('style', `background-color: ${user['color']}`);
              label.insertBefore(document.createTextNode(user['name']), null);
              cursor.insertBefore(label, null);
            }

            return cursor;
          },
        }),
        Bold,
        Italic,
      ],
      onUpdate: ({ editor }) => {
        if (!this.captions) return;
        const fullText = editor.getText();
        const words = fullText.split(/\s+/);

        const currentWordCount = words.length;
        if (currentWordCount < this.lastWordCount) {
          this.lastWordCount = currentWordCount;
          this.captions.innerHTML = '';
        }

        // Increment newWordsCount only if the word count has increased
        if (currentWordCount > this.lastWordCount) {
          this.newWordsCount += currentWordCount - this.lastWordCount;
          this.lastWordCount = currentWordCount;
        }

        // Update captions after 4 or more new words are added
        if (this.newWordsCount >= 4) {
          this.newWordsCount = 0;
          // Display last 7 words
          const last7Words = words.slice(-6);

          // Create HTML content for captions
          const captionsHtml = last7Words
            .map((word) => {
              return `<span style="color: white; background-color: rgba(0, 0, 0, 0.75); display: inline-block; padding: 2px 5px; margin: 2px;">${word}</span>`;
            })
            .join(' ');
          this.captions.innerHTML = captionsHtml;
        }

        console.log(editor.getJSON());
      },
      // autofocus: 'start', // todo: discuss
    });

    this.editor
      .chain()
      // .updateUser({
      //   name: user.name,
      //   color: user.color,
      //   id: user.id,
      // })
      .focus()
      .redo()
      .run();

    // this.provider.awareness?.on('change', () => {
    //   this.updateConnectedUsers();
    // });

    if (this.editor) {
      const extension = this.editor.extensionManager.extensions.find(
        (ext) => ext.name === 'userExtension'
      );

      if (extension) {
        extension.options.editor = this.editor;
      }

      this.editor.view.updateState(this.editor.view.state);
    }

    console.log(this.editor);
  }

  destroyEditor() {
    this.editor?.destroy();
  }

  toggleSpeaker(speaker: string) {
    const { state, view } = this.editor!;
    const { tr } = state;
    const { selection } = state;
    const { $from } = selection;
    const node = $from.node();

    if (node && node.type.name === 'paragraph') {
      const pos = state.selection.$anchor.before();
      const newAttrs = { ...node.attrs, speaker };
      tr.setNodeMarkup(pos, undefined, newAttrs);
    }

    view.dispatch(tr);
  }

  toggleShouldShow() {
    this.shouldShow = !this.shouldShow;
  }

  // updateTimestamp(currentTime: number) {
  //   console.log('update timestamp');
  //   const { state, view } = this.editor!;
  //   const { doc, tr, schema } = state;

  //   const activeElement = document.activeElement;
  //   // Remove previous bold from all words
  //   doc.descendants((node, pos) => {
  //     if (node.isText) {
  //       const { text, marks } = node;
  //       marks.find((mark) => {
  //         if (mark.type.name == 'bold') {
  //           tr.removeMark(pos, pos + text!.length, schema.marks['bold']);
  //         }
  //       });
  //     }
  //   });
  //   view.dispatch(tr);
  //   // Add bold to all words with the timestamp
  //   doc.descendants((node, pos) => {
  //     if (node.isText) {
  //       const { text, marks } = node;
  //       marks.find((mark) => {
  //         if (
  //           mark.type.name == 'word' &&
  //           mark.attrs['timestamp'] < currentTime
  //         ) {
  //           this.editor!.chain()
  //             .focus()
  //             .setTextSelection({ from: pos, to: pos + text!.length })
  //             .setBold()
  //             .run();
  //           this.editor!.commands.selectTextblockEnd(); // <----
  //         }
  //       });
  //     }
  //   });

  //   if (activeElement) {
  //     // activeElement.focus();
  //   }

  //   // doc.descendants((node, pos) => {
  //   //   console.log('doc.descendants', node, pos);
  //   //   if (node.isText) {
  //   //     for (const mark of node.marks) {
  //   //       if (mark.type.name === 'word') {
  //   //         console.log(node.attrs, currentTime);
  //   //         const attrs = mark.attrs;
  //   //         if (attrs['timestamp']) {
  //   //           const highlighted = attrs['timestamp'] < currentTime;
  //   //           if (highlighted !== attrs['highlight']) {
  //   //             tr.setNodeAttribute(pos, 'highlight', highlighted);
  //   //           }
  //   //         }
  //   //       }
  //   //     }
  //   //   }
  //   // });

  //   // view.dispatch(tr);
  // }

  // checkForTimestamp(event: Event | null = null) {
  //   if (event) {
  //     const target = event.target as HTMLInputElement;
  //     this.timestamp = target.value;
  //     if (target.value === '') {
  //       this.timestamp = 'Enter timestamp here...';
  //       return;
  //     }
  //     const timestampRegex = new RegExp(`\\b${this.timestamp || ''}\\b`, 'i');
  //     const { state, view } = this.editor!;
  //     const { doc, tr, schema } = state;

  //     // Remove previous bold from all words
  //     doc.descendants((node, pos) => {
  //       if (node.isText) {
  //         const { text, marks } = node;
  //         marks.find((mark) => {
  //           if (mark.type.name == 'bold') {
  //             tr.removeMark(pos, pos + text!.length, schema.marks.bold);
  //           }
  //         });
  //       }
  //     });
  //     view.dispatch(tr);
  //     // Add bold to all words with the timestamp
  //     doc.descendants((node, pos) => {
  //       if (node.isText) {
  //         const { text, marks } = node;
  //         marks.find((mark) => {
  //           if (
  //             mark.type.name == 'word' &&
  //             timestampRegex.test(mark.attrs.timestamp)
  //           ) {
  //             this.editor!.chain()
  //               .focus()
  //               .setTextSelection({ from: pos, to: pos + text!.length })
  //               .setBold()
  //               .run();
  //             this.editor!.commands.selectTextblockEnd();
  //           }
  //         });
  //       }
  //     });
  //   }
  // }

  // private updateConnectedUsers(): void {
  //   this.connectedUsers = [];
  //   this.provider.awareness?.getStates().forEach((state) => {
  //     if (state['user']) {
  //       // console.log(state);
  //       this.connectedUsers.push({
  //         name: state['user'].name,
  //         color: state['user'].color,
  //       });
  //     }
  //   });
  // }

  // setUser(event: Event | null = null) {
  //   if (event) {
  //     const target = event.target as HTMLInputElement;
  //     this.username = target.value;
  //   }
  //   this.awareness?.setLocalStateField('user', {
  //     name: this.username,
  //     color: this.color,
  //   });
  //   this.updateEditorColor();
  // }
  // changeColor(colorInput: Event) {
  //   const target = colorInput.target as HTMLInputElement;
  //   this.color = target.value;
  //   this.setUser();
  //   this.updateEditorColor();
  // }

  // private updateEditorColor() {
  //   if (this.editor) {
  //     const extension = this.editor.extensionManager.extensions.find(
  //       (ext) => ext.name === 'userExtension'
  //     );

  //     if (extension) {
  //       extension.options.color = this.color;
  //       extension.options.name = this.username;
  //     }
  //     this.editor.view.updateState(this.editor.view.state);
  //   }
  // }

  // getColor(user: { name: string; color: string }) {
  //   return 'color: ' + user.color + ';';
  // }

  onClickUndo() {
    this.editor?.commands.undo();
  }

  onClickRedo() {
    this.editor?.commands.redo();
  }

  // clear() {
  //   this.editor?.commands.clearContent();
  //   if (this.captions) this.captions.innerHTML = '';
  // }

  onToggleUsernames() {
    this.showUsernames = !this.showUsernames;
    this.destroyEditor();
    this.initEditor();
  }
}
