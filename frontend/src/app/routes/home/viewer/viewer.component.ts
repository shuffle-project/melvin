import { Component, HostListener, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
// use own viewer actions
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { LetDirective } from '@ngrx/component';
import { combineLatest, map } from 'rxjs';
import { HeaderComponent } from '../../../components/header/header.component';
import * as editorActions from '../../../store/actions/editor.actions';
import { AppState } from '../../../store/app.state';
import * as configSelector from '../../../store/selectors/config.selector';
import * as editorSelector from '../../../store/selectors/editor.selector';
import * as viewerSelector from '../../../store/selectors/viewer.selector';
import { AdjustLayoutDialogComponent } from './components/adjust-layout-dialog/adjust-layout-dialog.component';
import { InfoboxComponent } from './components/infobox/infobox.component';
import { PlayerComponent } from './components/player/player.component';
import { TranscriptComponent } from './components/transcript/transcript.component';
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
    InfoboxComponent,
  ],
})
export class ViewerComponent implements OnInit {
  @Input() public _projectId!: string;

  public projectId!: string;

  public project$ = this.store.select(editorSelector.selectProject);
  public media$ = this.store.select(editorSelector.selectMedia);
  public darkMode$ = this.store.select(configSelector.darkMode);

  // TODO layout according to this settings
  public transcriptEnabled$ = this.store.select(
    viewerSelector.selectTranscriptEnabled
  );
  public transcriptPosition$ = this.store.select(
    viewerSelector.selectTranscriptPosition
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
    if (this._projectId) {
      this.projectId = this._projectId;
    } else {
      this.projectId = this.route.snapshot.params['id'];
    }

    this.store.dispatch(
      editorActions.findProjectFromViewer({ projectId: this.projectId })
    );
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
