import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Store } from '@ngrx/store';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import {
  ProjectEntity,
  RecordingStatus,
} from '../../../../../services/api/entities/project.entity';
import { AppState } from '../../../../../store/app.state';
import * as authSelectors from '../../../../../store/selectors/auth.selector';
import * as editorSelectors from '../../../../../store/selectors/editor.selector';
import { LivestreamService } from '../../../livestream/livestream.service';

@Component({
    selector: 'app-live-controls',
    templateUrl: './live-controls.component.html',
    styleUrls: ['./live-controls.component.scss'],
    imports: [MatButtonModule, MatMenuModule, MatIconModule]
})
export class LiveControlsComponent implements OnInit, OnDestroy {
  private destroy$$ = new Subject<void>();

  private project$ = this.store.select(editorSelectors.selectProject);
  private user$ = this.store.select(authSelectors.selectUser);
  private project!: ProjectEntity;

  public showMenu: boolean = false;
  public text!: string;
  public icon!: string;
  public disabled = true;

  constructor(
    private store: Store<AppState>,
    private livestreamService: LivestreamService
  ) {}

  ngOnInit(): void {
    combineLatest([this.project$, this.user$])
      .pipe(takeUntil(this.destroy$$))
      .subscribe(([project, user]) => {
        if (project === null) {
          return;
        }

        const isOwner = project.createdBy.id === user?.id;
        this.project = project;

        this.showMenu = false;

        this.project.livestream?.livestreamStatus;
        this.project.livestream?.recordingStatus;

        if (isOwner) {
          this.disabled = false;
          if (
            project.livestream?.recordingStatus === RecordingStatus.RECORDING
          ) {
            this.showMenu = true;
            this.text = 'Aufzeichnung stoppen';
            this.icon = 'record';
          } else if (
            project.livestream?.recordingStatus ===
              RecordingStatus.NOT_STARTED ||
            project.livestream?.recordingStatus === RecordingStatus.STOPPED
          ) {
            this.text = 'Aufzeichnung starten';
            this.icon = 'stop';
          } else {
            this.text = 'Aufzeichnung pausiert';
            this.icon = 'pause';
          }
        } else {
          this.disabled = true;
          if (
            project.livestream?.recordingStatus === RecordingStatus.RECORDING
          ) {
            this.text = 'Aufzeichnung läuft';
            this.icon = 'record';
          } else {
            this.text = 'Aufzeichnung pausiert';
            this.icon = 'pause';
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$$.next();
  }

  onClickStart() {
    if (this.project.livestream?.recordingStatus === RecordingStatus.PAUSED) {
      this.livestreamService.resumeRecording(this.project.id);
    } else {
      this.livestreamService.startRecording(this.project.id);
    }

    // this.store.dispatch(
    //   projectsActions.updateProjectFromLiveControls({
    //     updateProject: {
    //       ...this.project,
    //       status: ProjectStatus.LIVE,
    //     },
    //   })
    // );
  }

  onClickStop() {
    this.livestreamService.stopRecording(this.project.id);
    // this.store.dispatch(
    //   projectsActions.updateProjectFromLiveControls({
    //     updateProject: {
    //       ...this.project,
    //       status: ProjectStatus.DRAFT,
    //     },
    //   })
    // );
  }

  onClickPause() {
    this.livestreamService.pauseRecording(this.project.id);
    //   this.store.dispatch(
    //     projectsActions.updateProjectFromLiveControls({
    //       updateProject: {
    //         ...this.project,
    //         // status: ProjectStatus.PAUSED, // TODO
    //         status: ProjectStatus.LIVE, // TODO
    //       },
    //     })
    //   );
  }
}
