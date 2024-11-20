import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
import { DurationPipe } from '../../../pipes/duration-pipe/duration.pipe';
import { FeatureEnabledPipe } from '../../../pipes/feature-enabled-pipe/feature-enabled.pipe';
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
import { CaptionsComponent } from './components/captions/captions.component';
import { EditorSettingsComponent } from './components/editor-settings/editor-settings.component';
import { JoinLivestreamModalComponent } from './components/join-livestream-modal/join-livestream-modal.component';
import { LiveControlsComponent } from './components/live-controls/live-controls.component';
import { UserTestControlsComponent } from './components/user-test-controls/user-test-controls.component';
import { VideoPlayerComponent } from './components/video-player/video-player.component';
import { WaveformComponent } from './components/waveform/waveform.component';
import { DialogHelpEditorComponent } from './dialog-help-editor/dialog-help-editor.component';
import { MediaService } from './services/media/media.service';

import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LetDirective, PushPipe } from '@ngrx/component';
import { DialogProjectTranscriptionComponent } from 'src/app/modules/project-dialogs/dialog-project-transcription/dialog-project-transcription.component';
import { HeaderComponent } from '../../../components/header/header.component';
import { SubtitleFormat } from 'src/app/services/api/entities/transcription.entity';

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
        CaptionsComponent,
        PushPipe,
        DurationPipe,
        FeatureEnabledPipe,
    ]
})
export class EditorComponent implements OnInit, OnDestroy {
  private destroy$$ = new Subject<void>();

  showWaveform = true;

  public editorUsers$ = this.store.select(editorSelectors.selectActiveUsers);

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

  // Media observables
  public isReady$ = this.mediaService.isReady$;
  public duration$ = this.mediaService.duration$;
  public isPlaying$ = this.store.select(editorSelectors.selectIsPlaying);
  public isLiveMode$ = this.store.select(editorSelectors.selectIsLiveMode);
  public isLiveInSync$ = this.store.select(editorSelectors.selectIsLiveInSync);
  public currentTime$ = this.mediaService.currentTime$;
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
    private mediaService: MediaService,
    private appService: AppService,
    public livestreamService: LivestreamService,
    public http: HttpClient
  ) {
    this.projectId = this.route.snapshot.params['id'];
  }

  async ngOnInit() {
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
  }

  async ngOnDestroy() {
    this.destroy$$.next();

    this.store.dispatch(editorActions.resetEditorState());

    await firstValueFrom(this.api.unsubscribeProject(this.projectId));
    await this.livestreamService.disconnect();
  }

  onSelectTranscription(transcriptionId: string) {
    this.store.dispatch(
      transcriptionsActions.selectFromEditor({ transcriptionId })
    );
  }

  onTogglePlayPause() {
    this.store.dispatch(editorActions.togglePlayPauseFromEditor());
  }

  onClickBackToLive() {
    this.store.dispatch(editorActions.backToLive());
  }

  onOpenHelpDialog() {
    this.dialog.open(DialogHelpEditorComponent);
  }

  onSkipForward() {
    this.mediaService.skipForward(5000);
  }

  onSkipBackward() {
    this.mediaService.skipBackward(5000);
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
      maxWidth: '800px',
      maxHeight: '90vh',
    });
  }

  onDownloadVideo(video: VideoEntity) {
    // TODO refactor, nur provisorisch
    this.http.get(video.url, { responseType: 'blob' }).subscribe((response) => {
      const urlCreator = window.URL || window.webkitURL;
      const imageUrl = urlCreator.createObjectURL(response);
      const tag = document.createElement('a');
      tag.href = imageUrl;
      tag.target = '_blank';
      tag.download = video.title + '.' + video.extension;
      document.body.appendChild(tag);
      tag.click();
      document.body.removeChild(tag);
    });
  }

  async onDownloadSubtitles(format: 'srt' | 'vtt' | 'txt') {
    const format2 =
      format === 'txt'
        ? SubtitleFormat.TXT
        : format === 'srt'
        ? SubtitleFormat.SRT
        : SubtitleFormat.VTT;

    const transcriptionId = await firstValueFrom(this.selectedTranscriptionId$);
    this.store.dispatch(
      transcriptionsActions.downloadSubtitles({
        transcriptionId,
        format: format2,
      })
    );
  }

  async onDownloadTranscript() {
    const transcriptionId = await firstValueFrom(this.selectedTranscriptionId$);
    this.store.dispatch(
      transcriptionsActions.downloadTranscript({ transcriptionId })
    );
  }

  async onClickTranscriptionEdit() {
    this.dialog.open(DialogProjectTranscriptionComponent, {
      data: { projectId: this.projectId },
      width: '100%',
      maxWidth: '800px',
      maxHeight: '90vh',
    });
  }

  onOpenJoinLivestreamModal(livestreamStarted: boolean) {
    this.dialog.open(JoinLivestreamModalComponent, {
      disableClose: !livestreamStarted,
      data: { livestreamStarted, projectId: this.projectId },
    });
  }
}
