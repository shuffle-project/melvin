import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  combineLatest,
  filter,
  firstValueFrom,
  lastValueFrom,
  map,
  Subject,
  takeUntil,
  tap,
} from 'rxjs';
import { AppState } from 'src/app/store/app.state';
import { ShareProjectDialogComponent } from '../../../components/share-project-dialog/share-project-dialog.component';
import {
  ProjectDetailComponent,
  ProjectDetailDialogData,
  ProjectDetailDialogTab,
} from '../../../modules/project-detail/project-detail.component';
import { ApiService } from '../../../services/api/api.service';
import {
  ProjectEntity,
  ProjectStatus,
} from '../../../services/api/entities/project.entity';
import { AppService } from '../../../services/app/app.service';
import * as editorActions from '../../../store/actions/editor.actions';
import * as projectsActions from '../../../store/actions/projects.actions';
import * as transcriptionsActions from '../../../store/actions/transcriptions.actions';
import * as authSelectors from '../../../store/selectors/auth.selector';
import * as editorSelectors from '../../../store/selectors/editor.selector';
import * as transcriptionsSelectors from '../../../store/selectors/transcriptions.selector';
import { LivestreamService } from '../livestream/livestream.service';
import { JoinLivestreamModalComponent } from './components/join-livestream-modal/join-livestream-modal.component';
import { DialogHelpEditorComponent } from './dialog-help-editor/dialog-help-editor.component';
import { MediaService } from './services/media/media.service';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
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
  ]).pipe(map(([userId, project]) => userId === project?.createdBy));

  public showZoomedWave = false;
  public projectId!: string;

  constructor(
    private store: Store<AppState>,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private api: ApiService,
    private mediaService: MediaService,
    private appService: AppService,
    public livestreamService: LivestreamService
  ) {}

  async ngOnInit() {
    this.projectId = this.route.snapshot.params['id'];

    this.store.dispatch(
      editorActions.findProject({ projectId: this.projectId })
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

    await firstValueFrom(this.api.unsubscribeProject(this.projectId));
    await this.livestreamService.disconnect();
  }

  onSelectTranscription(transcriptionId: string) {
    this.store.dispatch(transcriptionsActions.select({ transcriptionId }));
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
    });
  }

  async onDownloadSubtitles(format: 'srt' | 'vtt') {
    const transcriptionId = await firstValueFrom(this.selectedTranscriptionId$);
    this.store.dispatch(
      transcriptionsActions.downloadSubtitles({ transcriptionId, format })
    );
  }

  async onClickProjectEdit(tab: ProjectDetailDialogTab) {
    const project = (await firstValueFrom(this.project$)) as ProjectEntity;

    const data: ProjectDetailDialogData = {
      projectId: project.id,
      tab: tab,
    };

    this.dialog.open(ProjectDetailComponent, {
      data,
      width: '70%',
      height: '70vh',
    });
  }

  onOpenJoinLivestreamModal(livestreamStarted: boolean) {
    this.dialog.open(JoinLivestreamModalComponent, {
      disableClose: !livestreamStarted,
      data: { livestreamStarted, projectId: this.projectId },
    });
  }
}