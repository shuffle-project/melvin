import {
  AfterViewInit,
  Component,
  Injector,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { LetDirective } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { Editor } from '@tiptap/core';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Document from '@tiptap/extension-document';
import Text from '@tiptap/extension-text';
import { NgxTiptapModule } from 'ngx-tiptap';
import {
  BehaviorSubject,
  Observable,
  Subject,
  combineLatest,
  debounceTime,
  filter,
  firstValueFrom,
  skip,
  takeUntil,
} from 'rxjs';
import { AppState } from 'src/app/store/app.state';
import { EditorUser } from 'src/app/store/reducers/editor.reducer';
import * as editorSelector from 'src/app/store/selectors/editor.selector';
import { selectQueryParams } from 'src/app/store/selectors/router.selectors';
import { EditorUserEntity } from '../../../../interfaces/editor-user.interface';
import { WSService } from '../../../../services/ws/ws.service';
import { MediaService } from '../../editor/services/media/media.service';
import { CustomParagraph } from './schema/paragraph.schema';
import { UserExtension } from './schema/user.extension';
import { CustomWord } from './schema/word.schema';

enum CLIENT_STATUS {
  CONNECTING,
  CONNECTED,
  AUTHENTICATED,
  SYNCED,
  DISCONNECTED,
}

@Component({
  selector: 'app-tiptap-editor',
  imports: [
    MatIconButton,
    MatIcon,
    MatCheckbox,
    FormsModule,
    NgxTiptapModule,
    LetDirective,
    MatProgressSpinnerModule,
  ],
  templateUrl: './tiptap-editor.component.html',
  styleUrl: './tiptap-editor.component.scss',
})
export class TiptapEditorComponent implements AfterViewInit, OnInit, OnDestroy {
  @Input({ required: true }) transcriptionId$!: Observable<string>;
  transcriptionId = '';
  @Input({ required: true }) activeUsers!: EditorUserEntity[];
  @Input({ required: true }) editorUsers!: EditorUser[];

  private destroy$$ = new Subject<void>();
  private viewReady$ = new BehaviorSubject(false);

  private provider!: HocuspocusProvider;
  public editor?: Editor;

  public CLIENT_STATUS = CLIENT_STATUS;
  public status: CLIENT_STATUS = CLIENT_STATUS.CONNECTING;

  // public connectedUsers: { name: string; color: string }[] = [];
  public showUsernames = true;
  private captions: HTMLDivElement | undefined;
  // private awareness: HocuspocusProvider['awareness'] = null;
  private newWordsCount = 0;
  private lastWordCount = 0;

  shouldShow = false;

  public currentTime$ = this.mediaService.currentTime$;

  public spellchecking$ = this.store.select(editorSelector.selectSpellchecking);

  constructor(
    private mediaService: MediaService,
    private wsService: WSService,
    private injector: Injector,
    private store: Store<AppState>
  ) {}

  ngOnInit() {
    combineLatest([this.viewReady$, this.transcriptionId$])
      .pipe(
        filter(([viewReady, transcriptionId]) => viewReady && !!transcriptionId)
      )
      .pipe(takeUntil(this.destroy$$), debounceTime(0))
      .subscribe(([_, transcriptionId]) => {
        this.transcriptionId = transcriptionId;
        if (this.editor) {
          this.destroyEditor();
        }
        if (this.provider) {
          this.destroyConnection();
        }
        console.log('combine latest');

        this.initConnection(transcriptionId);
        this.initEditor();
      });

    this.currentTime$.pipe(takeUntil(this.destroy$$)).subscribe((time) => {
      const seconds = Math.floor(time / 1000);
      this.updateCurrentTimeCSSClass(seconds);
    });

    // rerender after change?
  }

  ngAfterViewInit() {
    this.viewReady$.next(true);

    this.store
      .select(editorSelector.selectShowUsernames)
      .pipe(takeUntil(this.destroy$$), skip(1))
      .subscribe((showUsernames) => {
        this.showUsernames = showUsernames;

        if (!this.editor) return;

        this.viewReady$.next(true);
      });
  }

  ngOnDestroy(): void {
    this.destroyConnection();
    this.destroyEditor();
    this.destroy$$.next();
  }

  initConnection(transcriptionId: string) {
    const url = `${this.wsService.getWebSocketURL()}?hocuspocus`;
    this.provider = new HocuspocusProvider({
      url,
      name: transcriptionId,
      onStatus: (status) => {
        console.log('onStatus');
        if (status.status.toString() === 'connecting')
          console.log('Connecting to server...');
        this.editor?.setEditable(false);
        this.status = CLIENT_STATUS.CONNECTING;
      },
      onConnect: () => {
        console.log('onConnect');
        this.status = CLIENT_STATUS.CONNECTED;
      },
      onAwarenessChange: (awareness) => {
        // console.log('onAwarenessChange');
        // console.log(awareness.states);
      },
      onAwarenessUpdate: (awareness) => {
        // console.log('onAwarenessUpdate');
        // console.log(awareness.states);
      },
      onDisconnect: () => {
        console.log('onDisconnect');
        this.editor?.setEditable(false);
        this.status = CLIENT_STATUS.DISCONNECTED;
      },
      onAuthenticated: () => {
        console.log('onAuthenticated');
        this.status = CLIENT_STATUS.AUTHENTICATED;
      },
      onSynced: () => {
        console.log('onSynced');
        this.editor?.setEditable(true);
        this.status = CLIENT_STATUS.SYNCED;
      },
    });
  }

  destroyEditor() {
    if (this.editor) {
      this.editor.destroy();
      this.editor = undefined;
      this.captions = undefined;
    }
  }

  destroyConnection() {
    this.provider.disconnect();
    this.provider.destroy();
  }

  async initEditor() {
    this.captions = document.getElementById('captions') as HTMLDivElement;

    const user = this.activeUsers[0];

    const queryParams = await firstValueFrom(
      this.store.select(selectQueryParams)
    );

    this.editor = new Editor({
      extensions: [
        Document,
        Text,
        CustomParagraph(this.injector),
        CustomWord(this.injector).configure({
          showWordBorders: queryParams['debug'],
        }),
        UserExtension(this.injector).configure({
          userId: user.id,
        }),
        Collaboration.configure({
          document: this.provider.document,
        }),
        CollaborationCursor.configure({
          provider: this.provider,
          user: {
            userId: user.id,
            name: user.name,
            colorName: user.color,
            showUsernames: this.showUsernames,
          },
          render: (user) => {
            const cursor = document.createElement('span');
            cursor.classList.add('collaboration-cursor__caret');
            const color = `rgb(var(--color-editor-user-${user['colorName']}-rgb))`;
            cursor.setAttribute('style', `border-color: ${color}`);

            if (this.showUsernames) {
              const label = document.createElement('div');
              label.classList.add('collaboration-cursor__label');
              label.setAttribute('style', `background-color: ${color}`);
              label.insertBefore(document.createTextNode(user['name']), null);
              cursor.insertBefore(label, null);
            }

            return cursor;
          },
          selectionRender: (user) => {
            const color = `rgba(var(--color-editor-user-${user['colorName']}-rgb), 0.7)`;
            return {
              style: `background-color: ${color}`,
              class: 'ProseMirror-yjs-selection',
            };
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
              return `<span style="color: white; background-color: rgba(0, 0, 0, 0.75); display: inline-block; padding: 0.125rem 0.3125rem; margin: 0.125rem;">${word}</span>`;
            })
            .join(' ');
          this.captions.innerHTML = captionsHtml;
        }
      },
    });
  }

  private updateCurrentTimeCSSClass(time: number) {
    for (let index = 0; index < document.styleSheets.length; index++) {
      const styleSheet = document.styleSheets[index];

      if (styleSheet.title === 'tiptap-timestamp') {
        for (let index = 0; index < styleSheet.cssRules.length; index++) {
          styleSheet.deleteRule(index);
        }
        styleSheet.insertRule(
          `.time-${time} { color: var(--color-white) !important; background:var(--color-black); }`,
          0
        );
      }
    }
  }

  canUndo() {
    return this.editor?.can().undo();
  }

  canRedo() {
    return this.editor?.can().redo();
  }

  changeSpeakerId(speakerId: string) {
    const { state, view } = this.editor!;
    const { tr } = state;
    const { selection } = state;
    const { $from } = selection;
    const node = $from.node();

    if (node && node.type.name === 'paragraph') {
      const pos = state.selection.$anchor.before();
      const newAttrs = { ...node.attrs, speakerId };
      tr.setNodeMarkup(pos, undefined, newAttrs);
      view.dispatch(tr);
    }
  }

  toggleShouldShow() {
    this.shouldShow = !this.shouldShow;
  }

  onClickUndo() {
    this.editor?.commands.undo();
  }

  onClickRedo() {
    this.editor?.commands.redo();
  }
}
