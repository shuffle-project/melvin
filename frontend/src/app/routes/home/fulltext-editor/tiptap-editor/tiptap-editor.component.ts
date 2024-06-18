import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { Editor } from '@tiptap/core';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Color from '@tiptap/extension-color';
import Document from '@tiptap/extension-document';
import Focus from '@tiptap/extension-focus';
import { Italic } from '@tiptap/extension-italic';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import TextStyle from '@tiptap/extension-text-style';
import { generate as generateUsername } from 'canihazusername';
import { environment } from '../../../../../environments/environment';
import { Partial, UserExtension, Word } from './tiptap.schema';

const colorArray = [
  // '#007BFF', // Bright Blue
  // '#FFC107', // Vivid Yellow
  '#6F42C1', // Strong Purple
  '#28A745', // Bright Green
  '#DC3545', // Vivid Red
  '#FD7E14', // Bright Orange
  // '#17A2B8', // Cyan
  // '#E83E8C', // Hot Pink
  // '#20C997', // Deep Teal
  '#FFC400', // Dark Yellow (Amber)
];

export function generateColor() {
  // pick a random color from the colors object
  return colorArray[Math.floor(Math.random() * colorArray.length)];
}

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
  imports: [],
  templateUrl: './tiptap-editor.component.html',
  styleUrl: './tiptap-editor.component.scss',
})
export class TiptapEditorComponent implements AfterViewInit, OnInit {
  @Input({ required: true }) transcriptionId!: string;

  @ViewChild('editor', { static: true }) editorRef!: ElementRef;
  public CLIENT_STATUS = CLIENT_STATUS;
  public userInformation: { name: string; color: string } = {
    name: '',
    color: '',
  };
  public isShowingUsername = true;
  public status: CLIENT_STATUS = CLIENT_STATUS.CONNECTING;
  public connectedUsers: { name: string; color: string }[] = [];
  public username = '';
  public color = '';
  public showUsernames = true;
  private captions: HTMLDivElement | undefined;
  private editor?: Editor;
  private provider!: HocuspocusProvider;
  private awareness: HocuspocusProvider['awareness'] = null;
  private newWordsCount = 0;
  private lastWordCount = 0;

  constructor() {}
  ngOnInit() {
    console.log(this.transcriptionId);
    this.username = generateUsername();
    this.color = generateColor();
    console.log(environment.hocuspocusUrl);
    this.provider = new HocuspocusProvider({
      url: environment.hocuspocusUrl, // wss://melvin-server-dummy.onrender.com
      name: this.transcriptionId,
      onStatus: (status) => {
        if (status.status.toString() === 'connecting')
          console.log('Connecting to server...');
        this.status = CLIENT_STATUS.CONNECTING;
      },
      onConnect: () => {
        this.status = CLIENT_STATUS.CONNECTED;
      },
      onAuthenticated: () => {
        this.status = CLIENT_STATUS.AUTHENTICATED;
      },
      onSynced: () => {
        this.status = CLIENT_STATUS.SYNCED;
      },
    });
    this.awareness = this.provider.awareness!;
  }

  ngAfterViewInit() {
    this.captions = document.getElementById('captions') as HTMLDivElement;

    this.editor = new Editor({
      element: this.editorRef.nativeElement,
      extensions: [
        Document,
        Paragraph,
        Text,
        TextStyle,
        Focus,
        Color,
        Word,
        Partial,
        UserExtension.configure({
          color: this.color,
          name: this.username,
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
        name: this.username,
        color: this.color,
      })
      .focus()
      .redo()
      .run();

    this.provider.awareness?.on('change', () => {
      this.updateConnectedUsers();
    });

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

  private updateConnectedUsers(): void {
    this.connectedUsers = [];
    this.provider.awareness?.getStates().forEach((state) => {
      if (state['user']) {
        this.connectedUsers.push({
          name: state['user'].name,
          color: state['user'].color,
        });
      }
    });
  }

  setUser(event: Event | null = null) {
    if (event) {
      const target = event.target as HTMLInputElement;
      this.username = target.value;
    }
    this.awareness?.setLocalStateField('user', {
      name: this.username,
      color: this.color,
    });
    this.updateEditorColor();
  }
  changeColor(colorInput: Event) {
    const target = colorInput.target as HTMLInputElement;
    this.color = target.value;
    this.setUser();
    this.updateEditorColor();
  }

  private updateEditorColor() {
    if (this.editor) {
      const extension = this.editor.extensionManager.extensions.find(
        (ext) => ext.name === 'userExtension'
      );

      if (extension) {
        extension.options.color = this.color;
        extension.options.name = this.username;
      }
      this.editor.view.updateState(this.editor.view.state);
    }
  }

  getColor(user: { name: string; color: string }) {
    return 'color: ' + user.color + ';';
  }

  undo() {
    this.editor?.commands.undo();
  }
  redo() {
    this.editor?.commands.redo();
  }
  clear() {
    this.editor?.commands.clearContent();
    if (this.captions) this.captions.innerHTML = '';
  }

  onToggleUsernames() {
    this.showUsernames = !this.showUsernames;

    // reload editor to show/hide usernames
    this.editor?.destroy();
    this.ngAfterViewInit();
  }
}
