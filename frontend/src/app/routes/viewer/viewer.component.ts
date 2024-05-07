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
import { LetDirective } from '@ngrx/component';
import { Subject } from 'rxjs';
import { HeaderComponent } from '../../components/header/header.component';
import { LogoComponent } from '../../components/logo/logo.component';
import * as viewerActions from '../../store/actions/viewer.actions';
import { AppState } from '../../store/app.state';
import * as configSelector from '../../store/selectors/config.selector';
import * as viewerSelector from '../../store/selectors/viewer.selector';
import { AdjustLayoutDialogComponent } from '../viewer/components/adjust-layout-dialog/adjust-layout-dialog.component';
import { InfoboxComponent } from '../viewer/components/infobox/infobox.component';
import { PlayerComponent } from '../viewer/components/player/player.component';
import { TranscriptComponent } from '../viewer/components/transcript/transcript.component';
import { ControlsComponent } from './components/player/controls/controls.component';
import { OverlayService } from './services/overlay.service';
import { ViewerService } from './services/viewer.service';

@Component({
  selector: 'app-viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.scss'],
  standalone: true,
  imports: [
    HeaderComponent,
    LetDirective,
    MatButtonModule,
    TranscriptComponent,
    PlayerComponent,
    MatProgressSpinnerModule,
    InfoboxComponent,
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

  /**
   * DATA
   */
  public viewerError$ = this.store.select(viewerSelector.vLoginError);
  public selectLoading$ = this.store.select(viewerSelector.vLoginLoading);

  public project$ = this.store.select(viewerSelector.vProject);
  public media$ = this.store.select(viewerSelector.vProjectMedia);
  public darkMode$ = this.store.select(configSelector.darkMode);
  public transcriptPosition$ = this.store.select(
    viewerSelector.vTranscriptPosition
  );

  constructor(
    private route: ActivatedRoute,
    private store: Store<AppState>,
    public dialog: MatDialog,
    private viewerService: ViewerService,
    public overlayService: OverlayService
  ) {
    this.overlayService.init();
  }

  ngOnInit(): void {
    // const token = this.route.snapshot.params['token'];
    console.log(this.token, this.embed);
    this.store.dispatch(viewerActions.viewerLogin({ token: this.token }));

    this.overlayService.init();

    if (this.embed) this.store.dispatch(viewerActions.hideTranscript());
  }

  ngOnDestroy() {
    this.overlayService.destroy();
    this.destroy$$.next();
  }

  onOpenAdjustLayoutDialog() {
    this.viewerService.audio?.pause();
    // TODO do we want to play after closing the dialog??
    this.dialog.open(AdjustLayoutDialogComponent);
  }

  isFullscreenActive() {
    return (
      document.fullscreenElement || (document as any).webkitFullscreenElement
    );
  }
}
