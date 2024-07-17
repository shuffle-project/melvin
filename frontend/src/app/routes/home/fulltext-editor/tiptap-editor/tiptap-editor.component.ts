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
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Color from '@tiptap/extension-color';
import Document from '@tiptap/extension-document';
import FloatingMenu from '@tiptap/extension-floating-menu';
import Focus from '@tiptap/extension-focus';
import { Italic } from '@tiptap/extension-italic';
import Paragraph from '@tiptap/extension-paragraph';
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

  constructor() {}

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
    const color = getComputedStyle(document.body).getPropertyValue(
      `--color-editor-user-${user.color}`
    );

    this.editor = new Editor({
      element: this.editorRef.nativeElement,
      extensions: [
        Document,
        Paragraph,
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
          color: color,
          name: user.name,
          editor: this.editor,
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

            console.log('this.showUsernames');
            console.log(this.showUsernames);
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
        Italic.configure({
          HTMLAttributes: {
            class: 'partial',
          },
        }),
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
      .updateUser({
        name: user.name,
        color,
      })
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
