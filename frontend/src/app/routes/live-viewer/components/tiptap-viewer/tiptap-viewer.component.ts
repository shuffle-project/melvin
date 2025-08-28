import {
  AfterViewInit,
  Component,
  Injector,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { Editor } from '@tiptap/core';
import Collaboration from '@tiptap/extension-collaboration';
import Document from '@tiptap/extension-document';
import Text from '@tiptap/extension-text';
import { Subject } from 'rxjs';
import { CLIENT_STATUS } from 'src/app/routes/home/editor/components/tiptap-editor/tiptap-editor.component';
import { ProjectEntity } from 'src/app/services/api/entities/project.entity';
import { WSService } from 'src/app/services/ws/ws.service';
import { CustomParagraphViewer } from './schema/paragraph-viewer.schema';
import { CustomWordViewer } from './schema/word-viewer.schema';

@Component({
  selector: 'app-tiptap-viewer',
  imports: [],
  templateUrl: './tiptap-viewer.component.html',
  styleUrl: './tiptap-viewer.component.scss',
})
export class TiptapViewerComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input({ required: true }) project!: ProjectEntity;

  private destroy$$ = new Subject<void>();

  private transcriptionId!: string;

  public CLIENT_STATUS = CLIENT_STATUS;
  public status: CLIENT_STATUS = CLIENT_STATUS.CONNECTING;

  private lastWordCount = 0;
  private newWordsCount = 0;

  private captions: HTMLDivElement | undefined;
  private provider!: HocuspocusProvider;
  public editor?: Editor;

  constructor(private wsService: WSService, private injector: Injector) {}

  ngOnInit(): void {
    //TODO: right now only on transcription exists in a live project, check if still applies
    this.transcriptionId = this.project.transcriptions[0]?.id;
  }

  ngAfterViewInit(): void {
    if (this.editor) {
      this.destroyEditor();
    }
    if (this.provider) {
      this.destroyConnection();
    }

    if (this.transcriptionId) {
      this.initConnection(this.transcriptionId);
      this.initEditor();
    }
  }

  initConnection(transcriptionId: string) {
    const url = `${this.wsService.getWebSocketURL()}?hocuspocus`;

    this.provider = new HocuspocusProvider({
      url,
      name: transcriptionId,
      onStatus: (status) => {
        if (status.status.toString() === 'connecting') {
          console.log('Connecting to server...');
          this.status = CLIENT_STATUS.CONNECTING;
        }
      },
      onConnect: () => {
        console.log('Connected to server');
        this.status = CLIENT_STATUS.CONNECTED;
      },
      onDisconnect: () => {
        console.log('Disconnected from server');
        this.status = CLIENT_STATUS.DISCONNECTED;
      },
      onAuthenticated: () => {
        console.log('Authenticated');
        this.status = CLIENT_STATUS.AUTHENTICATED;
      },
      onSynced: () => {
        console.log('Synced with server');
        this.status = CLIENT_STATUS.SYNCED;
      },
    });
  }

  initEditor() {
    this.captions = document.getElementById('captions') as HTMLDivElement;

    this.editor = new Editor({
      editable: false,
      extensions: [
        Document,
        Text,
        CustomWordViewer(this.injector),
        CustomParagraphViewer(this.injector),
        Collaboration.configure({
          document: this.provider.document,
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
        // if (currentWordCount > this.lastWordCount) {
        //   this.newWordsCount += currentWordCount - this.lastWordCount;
        //   this.lastWordCount = currentWordCount;
        // }

        // Update captions after 4 or more new words are added
        // if (this.newWordsCount >= 4) {
        //   this.newWordsCount = 0;
        //   // Display last 7 words
        //   const last7Words = words.slice(-6);

        //   // Create HTML content for captions
        //   const captionsHtml = last7Words
        //     .map((word) => {
        //       return `<span>${word}</span>`;
        //     })
        //     .join(' ');
        //   this.captions.innerHTML = captionsHtml;
        // }

        const captionsHTML = words
          .map((word) => `<span>${word}</span>`)
          .join(' ');
        this.captions.innerHTML = captionsHTML;
      },
    });
  }

  ngOnDestroy(): void {
    this.destroyConnection();
    this.destroyEditor();
    this.destroy$$.next();
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
}
