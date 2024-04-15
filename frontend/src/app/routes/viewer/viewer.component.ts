import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
// use own viewer actions
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LetDirective } from '@ngrx/component';
import { combineLatest, map } from 'rxjs';
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
import { ViewerService } from './viewer.service';

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
  ],
})
export class ViewerComponent implements OnInit {
  public viewerError$ = this.store.select(viewerSelector.vLoginError);
  public selectLoading$ = this.store.select(viewerSelector.vLoginLoading);

  public project$ = this.store.select(viewerSelector.vProject);
  public media$ = this.store.select(viewerSelector.vProjectMedia);
  public darkMode$ = this.store.select(configSelector.darkMode);

  // TODO layout according to this settings
  public transcriptEnabled$ = this.store.select(
    viewerSelector.vTranscriptEnabled
  );
  public transcriptPosition$ = this.store.select(
    viewerSelector.vTranscriptPosition
  );

  layoutSettings$ = combineLatest([
    this.transcriptEnabled$,
    this.transcriptPosition$,
  ]).pipe(
    map(([transcriptEnabled, transcriptPosition]) => ({
      transcriptEnabled,
      transcriptPosition,
    }))
  );

  constructor(
    private route: ActivatedRoute,
    private store: Store<AppState>,
    public dialog: MatDialog,
    private viewerService: ViewerService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.params['token'];
    this.store.dispatch(viewerActions.viewerLogin({ token }));
  }

  @HostListener('window:keydown.ArrowRight', ['$event'])
  arrowRight(event: any) {
    // TODOD wenn man hier vor/zurückspielt müsste man alle events innerhalt mit stopPropagation versehen.. Was teilweise nicht so einfach ist bei material sachen
    // console.log(event);
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

  // onToggleChange() {
  //   this.store.dispatch(configActions.toggleDarkMode());
  // }
}
