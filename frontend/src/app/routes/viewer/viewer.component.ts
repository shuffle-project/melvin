import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
// use own viewer actions
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Title } from '@angular/platform-browser';
import { LetDirective } from '@ngrx/component';
import { Subject, takeUntil } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LogoComponent } from '../../components/logo/logo.component';
import * as viewerActions from '../../store/actions/viewer.actions';
import { AppState } from '../../store/app.state';
import * as configSelector from '../../store/selectors/config.selector';
import * as viewerSelector from '../../store/selectors/viewer.selector';
import { AdjustLayoutDialogComponent } from '../viewer/components/adjust-layout-dialog/adjust-layout-dialog.component';
import { PlayerComponent } from '../viewer/components/player/player.component';
import { TranscriptComponent } from '../viewer/components/transcript/transcript.component';
import { ControlsComponent } from './components/player/controls/controls.component';
import { OverlayService } from './services/overlay.service';
import { ViewerService } from './services/viewer.service';
import { TranscriptPosition } from './viewer.interfaces';

@Component({
  selector: 'app-viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.scss'],
  imports: [
    LetDirective,
    MatButtonModule,
    TranscriptComponent,
    PlayerComponent,
    MatProgressSpinnerModule,
    LogoComponent,
    RouterLink,
    ControlsComponent,
  ],
  animations: [
    trigger('fade', [
      state('show', style({ opacity: 1 })),
      state('hide', style({ opacity: 0 })),
      transition('hide => show', [style({ opacity: 1 })]),
      transition('show => hide', [animate(0, style({ opacity: 0 }))]),
    ]),
  ],
})
export class ViewerComponent implements OnInit, OnDestroy {
  private destroy$$ = new Subject<void>();

  @Input() token!: string;
  @Input() embed!: boolean | undefined;

  feedbackLink = environment.features.feedbackLink;

  /**
   * DATA
   */
  public viewerError$ = this.store.select(viewerSelector.vLoginError);
  public selectLoading$ = this.store.select(viewerSelector.vLoginLoading);

  public project$ = this.store.select(viewerSelector.vProject);
  public media$ = this.store.select(viewerSelector.vProjectMedia);
  public colorTheme$ = this.store.select(configSelector.colorTheme);
  public transcriptPosition$ = this.store.select(
    viewerSelector.vTranscriptPosition
  );

  constructor(
    private route: ActivatedRoute,
    private store: Store<AppState>,
    public dialog: MatDialog,
    private viewerService: ViewerService,
    public overlayService: OverlayService,
    private titleService: Title
  ) {
    this.overlayService.init();
    this.project$.pipe(takeUntil(this.destroy$$)).subscribe((project) => {
      if (project) this.titleService.setTitle(project.title + ' - Melvin');
    });
  }

  ngOnInit(): void {
    this.store.dispatch(viewerActions.viewerLogin({ token: this.token }));

    this.overlayService.init();

    if (this.embed)
      this.store.dispatch(
        viewerActions.changeTranscriptPositionEmbed({
          transcriptPosition: TranscriptPosition.OFF,
        })
      );
  }

  ngOnDestroy() {
    this.overlayService.destroy();
    this.destroy$$.next();
  }

  onOpenAdjustLayoutDialog() {
    this.dialog.open(AdjustLayoutDialogComponent, {
      width: '100%',
      maxWidth: '50rem',
      maxHeight: '90vh',
    });
  }

  isFullscreenActive() {
    return (
      document.fullscreenElement || (document as any).webkitFullscreenElement
    );
  }
}
