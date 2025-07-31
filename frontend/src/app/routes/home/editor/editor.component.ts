import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  Subject,
  combineLatest,
  filter,
  firstValueFrom,
  lastValueFrom,
  map,
  takeUntil,
  tap,
} from 'rxjs';
import { AppState } from 'src/app/store/app.state';
import { AvatarGroupComponent } from '../../../components/avatar-group/avatar-group.component';
import { ShareProjectDialogComponent } from '../../../components/share-project-dialog/share-project-dialog.component';

import { ApiService } from '../../../services/api/api.service';
import {
  ProjectEntity,
  ProjectStatus,
  VideoEntity,
} from '../../../services/api/entities/project.entity';
import { AppService } from '../../../services/app/app.service';
import * as editorActions from '../../../store/actions/editor.actions';
import * as projectsActions from '../../../store/actions/projects.actions';
import * as transcriptionsActions from '../../../store/actions/transcriptions.actions';
import * as authSelectors from '../../../store/selectors/auth.selector';
import * as editorSelectors from '../../../store/selectors/editor.selector';
import * as transcriptionsSelectors from '../../../store/selectors/transcriptions.selector';
import { LivestreamService } from '../livestream/livestream.service';

import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { LetDirective, PushPipe } from '@ngrx/component';
import { DeleteConfirmationService } from 'src/app/components/delete-confirmation-dialog/delete-confirmation.service';
import { CreateTranscriptionDialogComponent } from 'src/app/modules/project-dialogs/components/project-transcription/components/create-transcription-dialog/create-transcription-dialog.component';
import { MediaCategoryPipe } from 'src/app/pipes/media-category-pipe/media-category.pipe';
import { ProjectStatusPipe } from 'src/app/pipes/project-status-pipe/project-status.pipe';
import { WrittenOutLanguagePipe } from 'src/app/pipes/written-out-language-pipe/written-out-language.pipe';
import {
  SubtitleFormat,
  TranscriptionStatus,
} from 'src/app/services/api/entities/transcription.entity';
import { HeaderComponent } from '../../../components/header/header.component';
import { DialogHelpEditorComponent } from './components/dialog-help-editor/dialog-help-editor.component';
import { EditorSettingsComponent } from './components/editor-settings/editor-settings.component';
import { JoinLivestreamModalComponent } from './components/join-livestream-modal/join-livestream-modal.component';
import { LiveControlsComponent } from './components/live-controls/live-controls.component';
import { ShortcutsComponent } from './components/shortcuts/short-cuts/shortcuts.component';
import { TiptapEditorComponent } from './components/tiptap-editor/tiptap-editor.component';
import { TranscriptionMenuContentComponent } from './components/transcription-menu-content/transcription-menu-content.component';
import { UserTestControlsComponent } from './components/user-test-controls/user-test-controls.component';
import { VideoControlsComponent } from './components/video-controls/video-controls/video-controls.component';
import { VideoPlayerComponent } from './components/video-player/video-player.component';
import { WaveformComponent } from './components/waveform/waveform.component';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
  imports: [
    HeaderComponent,
    LetDirective,
    MatButtonModule,
    MatTooltipModule,
    RouterLink,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    AvatarGroupComponent,
    WaveformComponent,
    LiveControlsComponent,
    MatSlideToggleModule,
    ReactiveFormsModule,
    FormsModule,
    VideoPlayerComponent,
    EditorSettingsComponent,
    UserTestControlsComponent,
    PushPipe,
    TiptapEditorComponent,
    MediaCategoryPipe,
    VideoControlsComponent,
    ShortcutsComponent,
    TranscriptionMenuContentComponent,
    WrittenOutLanguagePipe,
    ProjectStatusPipe,
  ],
})
export class EditorComponent implements OnInit, OnDestroy {
  private destroy$$ = new Subject<void>();

  showWaveform = true;

  public editorUsers$ = this.store.select(editorSelectors.selectEditorUsers);
  public activeUsers$ = this.store.select(editorSelectors.selectActiveUsers);

  private modalOpened = false;
  public project$ = this.store.select(editorSelectors.selectProject).pipe(
    tap((project) => {
      // only if project is set, status is live and modal wasnt opened yet
      if (
        project &&
        [ProjectStatus.LIVE].includes(project.status) &&
        !this.modalOpened
      ) {
        if (!project.livestream) {
          // status live, but livestream not started
          this.modalOpened = true;
          this.onOpenJoinLivestreamModal(false);
        } else if (
          !this.appService.hasUserInteractedWithDOM &&
          [ProjectStatus.LIVE].includes(project.status)
        ) {
          // user joins running livestream
          this.modalOpened = true;
          this.onOpenJoinLivestreamModal(true);
        }
      }
    })
  );

  public projectMedia$ = this.store.select(editorSelectors.selectMedia);

  public transcriptionsList$ = this.store.select(
    transcriptionsSelectors.selectTranscriptionList
  );

  public selectedTranscriptionId$ = this.store.select(
    transcriptionsSelectors.selectTranscriptionId
  );

  public transcriptionStatus = TranscriptionStatus;

  // Media observables
  public isLiveMode$ = this.store.select(editorSelectors.selectIsLiveMode);
  public isLiveInSync$ = this.store.select(editorSelectors.selectIsLiveInSync);
  public isOwner$ = combineLatest([
    this.store.select(authSelectors.selectUserId),
    this.store.select(editorSelectors.selectProject),
  ]).pipe(map(([userId, project]) => userId === project?.createdBy.id));

  public showZoomedWave = false;
  public projectId!: string;
  public transcriptionId!: string;

  constructor(
    private store: Store<AppState>,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private api: ApiService,
    private appService: AppService,
    public livestreamService: LivestreamService,
    public httpClient: HttpClient,
    private deleteService: DeleteConfirmationService,
    private router: Router,
    private titleService: Title
  ) {}

  async ngOnInit() {
    this.projectId = this.route.snapshot.params['id'];
    this.transcriptionId = this.route.snapshot.queryParams['transcriptionId'];

    if (this.transcriptionId)
      this.store.dispatch(
        transcriptionsActions.changeTranscriptionId({
          transcriptionId: this.transcriptionId,
        })
      );

    this.store.dispatch(
      editorActions.findProjectFromEditor({ projectId: this.projectId })
    );

    this.store
      .select(authSelectors.selectIsUserConnectedToWs)
      .pipe(
        takeUntil(this.destroy$$),
        filter((isConnected) => isConnected),
        tap(async () => {
          await lastValueFrom(this.api.subscribeProject(this.projectId));
        })
      )
      .subscribe();

    this.isLiveMode$.pipe(takeUntil(this.destroy$$)).subscribe((isLive) => {
      // TODO remove
      if (isLive != null) {
        this.showWaveform = false;
        setTimeout(() => {
          this.showWaveform = true;
        }, 1);
      }
    });

    this.project$.pipe(takeUntil(this.destroy$$)).subscribe((project) => {
      if (project)
        this.titleService.setTitle(project.title + ' - Editor - Melvin');
    });
  }

  async ngOnDestroy() {
    this.destroy$$.next();

    this.store.dispatch(editorActions.resetEditorState());

    await firstValueFrom(this.api.unsubscribeProject(this.projectId));
    await this.livestreamService.disconnect();
  }

  onSelectTranscription(transcriptionId: string) {
    this.router.navigate([], { queryParams: { transcriptionId } });
    this.store.dispatch(
      transcriptionsActions.selectFromEditor({ transcriptionId })
    );
  }

  onOpenHelpDialog() {
    this.dialog.open(DialogHelpEditorComponent);
  }

  onChangeProjectTitle(newProjectTitle: string, project: ProjectEntity | null) {
    if (project === null) {
      return;
    }

    if (project.title !== newProjectTitle) {
      let projectWithNewTitle: ProjectEntity = {
        ...project,
        title: newProjectTitle.trim(),
      };
      this.store.dispatch(
        projectsActions.updateFromEditor({
          updateProject: projectWithNewTitle,
        })
      );
    }
  }

  async onClickShare() {
    const project = await firstValueFrom(this.project$);

    this.dialog.open(ShareProjectDialogComponent, {
      data: {
        project,
      },
      width: '100%',
      maxWidth: '50rem',
      maxHeight: '90vh',
    });
  }

  onDownloadVideo(videoEntity: VideoEntity, projectTitle: string = '') {
    const regexSpecialChars = /[`~!@#$%^&*()|+\=?;:'",.<>\{\}\[\]\\\/]/gi;
    const filename = `${projectTitle}_${
      videoEntity.title ? videoEntity.title : videoEntity.category
    }`;

    const readyFilename = filename
      .replace(regexSpecialChars, '')
      .replace(/ /g, '-');

    this.httpClient
      .get(videoEntity.url, { responseType: 'blob' })
      .subscribe((response) => {
        const urlCreator = window.URL || window.webkitURL;
        const imageUrl = urlCreator.createObjectURL(response);
        const tag = document.createElement('a');
        tag.href = imageUrl;
        tag.target = '_blank';
        tag.download = readyFilename + '.' + videoEntity.extension;
        document.body.appendChild(tag);
        tag.click();
        document.body.removeChild(tag);
      });
  }

  onDownloadTxt(transcriptionId: string) {
    this.onDownloadSubtitles(transcriptionId, SubtitleFormat.TXT);
  }
  onDownloadVtt(transcriptionId: string) {
    this.onDownloadSubtitles(transcriptionId, SubtitleFormat.VTT);
  }
  onDownloadSrt(transcriptionId: string) {
    this.onDownloadSubtitles(transcriptionId, SubtitleFormat.SRT);
  }

  onDownloadSubtitles(transcriptionId: string, format: SubtitleFormat) {
    this.store.dispatch(
      transcriptionsActions.downloadSubtitles({
        transcriptionId,
        format,
      })
    );
  }

  async onDownloadTranscript() {
    const transcriptionId = await firstValueFrom(this.selectedTranscriptionId$);
    this.store.dispatch(
      transcriptionsActions.downloadTranscript({ transcriptionId })
    );
  }

  async onDeleteProject() {
    const project = await firstValueFrom(this.project$);
    const isConfirmed = await this.deleteService.deleteProject(project!);

    if (isConfirmed) {
      this.router.navigate(['/home/projects']);
    }
  }

  onOpenJoinLivestreamModal(livestreamStarted: boolean) {
    this.dialog.open(JoinLivestreamModalComponent, {
      disableClose: !livestreamStarted,
      data: { livestreamStarted, projectId: this.projectId },
    });
  }

  onOpenTranslationDialog() {
    this.dialog.open(CreateTranscriptionDialogComponent, {
      data: { selectedTab: 'translate' },
      width: '100%',
      maxWidth: '50rem',
      maxHeight: '90vh',
    });
  }
}
