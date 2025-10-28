import {
  AfterViewInit,
  Component,
  Injector,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { LetDirective, PushPipe } from '@ngrx/component';
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
  map,
  skip,
  takeUntil,
} from 'rxjs';
import { EditorUserEntity } from 'src/app/interfaces/editor-user.interface';
import { WrittenOutLanguagePipe } from 'src/app/pipes/written-out-language-pipe/written-out-language.pipe';
import { TranscriptionStatus } from 'src/app/services/api/entities/transcription.entity';
import { WSService } from 'src/app/services/ws/ws.service';
import { AppState } from 'src/app/store/app.state';
import { EditorUser } from 'src/app/store/reducers/editor.reducer';
import * as editorSelector from 'src/app/store/selectors/editor.selector';
import { selectQueryParams } from 'src/app/store/selectors/router.selectors';
import * as transcriptionsSelectors from '../../../../../store/selectors/transcriptions.selector';
import { MediaService } from '../../service/media/media.service';
import { TranscriptionMenuContentComponent } from '../transcription-menu-content/transcription-menu-content.component';
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
    MatButtonModule,
    MatIcon,
    MatMenuModule,
    MatDividerModule,
    FormsModule,
    NgxTiptapModule,
    LetDirective,
    MatProgressSpinnerModule,
    PushPipe,
    WrittenOutLanguagePipe,
    TranscriptionMenuContentComponent,
  ],
  templateUrl: './tiptap-editor.component.html',
  styleUrl: './tiptap-editor.component.scss',
})
export class TiptapEditorComponent implements AfterViewInit, OnInit, OnDestroy {
  @Input({ required: true }) transcriptionId$!: Observable<string>;
  transcriptionId = '';
  @Input({ required: true }) activeUsers!: EditorUserEntity[];
  @Input({ required: true }) editorUsers!: EditorUser[];
  @Input({ required: true }) projectId!: string;

  private destroy$$ = new Subject<void>();
  private viewReady$ = new BehaviorSubject(false);

  private provider!: HocuspocusProvider;
  public editor?: Editor;

  public CLIENT_STATUS = CLIENT_STATUS;
  public status: CLIENT_STATUS = CLIENT_STATUS.CONNECTING;
  public transcriptionStatus = TranscriptionStatus.WAITING;
  // public connectedUsers: { name: string; color: string }[] = [];
  public showUsernames = true;
  private captions: HTMLDivElement | undefined;
  // private awareness: HocuspocusProvider['awareness'] = null;
  private newWordsCount = 0;
  private lastWordCount = 0;

  shouldShow = false;

  public currentTime$ = this.mediaService.currentTime$;

  public spellchecking$ = this.store.select(editorSelector.selectSpellchecking);

  public transcriptionsList$ = this.store.select(
    transcriptionsSelectors.selectTranscriptionList
  );

  public selectedTranscriptionId$ = this.store.select(
    transcriptionsSelectors.selectTranscriptionId
  );

  public selectedTranscription$ = combineLatest([
    this.selectedTranscriptionId$,
    this.transcriptionsList$,
  ]).pipe(
    map(
      ([transcriptionId, transcriptionsList]) =>
        transcriptionsList.find(
          (transcription) => transcription.id === transcriptionId
        )!
    )
  );

  constructor(
    private mediaService: MediaService,
    private wsService: WSService,
    private injector: Injector,
    private store: Store<AppState>
  ) {
    this.selectedTranscription$
      .pipe(takeUntil(this.destroy$$))
      .subscribe((transcription) => {
        if (transcription) {
          this.transcriptionStatus = transcription.status;

          this.resetIsEditable();
        }
      });
  }

  private resetIsEditable() {
    if (
      this.transcriptionStatus === TranscriptionStatus.OK &&
      this.status === CLIENT_STATUS.SYNCED
    ) {
      this.editor?.setEditable(true);
    } else {
      this.editor?.setEditable(false);
    }
  }

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
        this.status = CLIENT_STATUS.CONNECTING;
        this.resetIsEditable();
      },
      onConnect: () => {
        console.log('onConnect');
        this.status = CLIENT_STATUS.CONNECTED;
      },
      onDisconnect: () => {
        console.log('onDisconnect');
        this.status = CLIENT_STATUS.DISCONNECTED;
        this.resetIsEditable();
      },
      onAuthenticated: () => {
        console.log('onAuthenticated');
        this.status = CLIENT_STATUS.AUTHENTICATED;
      },
      onSynced: () => {
        console.log('onSynced');
        this.status = CLIENT_STATUS.SYNCED;
        this.resetIsEditable();
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
              label.setAttribute(
                'style',
                `background-color: ${color}; color: var(--color-white);`
              );
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
