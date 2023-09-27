import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
// use own viewer actions
import { MatDialog } from '@angular/material/dialog';
import { combineLatest, map } from 'rxjs';
import * as configActions from '../../../store/actions/config.actions';
import * as editorActions from '../../../store/actions/editor.actions';
import { AppState } from '../../../store/app.state';
import * as configSelector from '../../../store/selectors/config.selector';
import * as editorSelector from '../../../store/selectors/editor.selector';
import * as viewerSelector from '../../../store/selectors/viewer.selector';
import { AdjustLayoutDialogComponent } from './components/adjust-layout-dialog/adjust-layout-dialog.component';
import { ViewerService } from './viewer.service';

@Component({
  selector: 'app-viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.scss'],
})
export class ViewerComponent implements OnInit {
  public projectId!: string;

  public project$ = this.store.select(editorSelector.selectProject);
  darkMode$ = this.store.select(configSelector.darkMode);

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
    this.projectId = this.route.snapshot.params['id'];

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

  onToggleChange() {
    this.store.dispatch(configActions.toggleDarkMode());
  }
}
