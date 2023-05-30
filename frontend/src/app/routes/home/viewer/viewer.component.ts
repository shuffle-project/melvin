import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
// use own viewer actions
import { MatDialog } from '@angular/material/dialog';
import { combineLatest, map } from 'rxjs';
import * as editorActions from '../../../store/actions/editor.actions';
import { AppState } from '../../../store/app.state';
import * as editorSelector from '../../../store/selectors/editor.selector';
import * as viewerSelector from '../../../store/selectors/viewer.selector';
import { AdjustLayoutDialogComponent } from './components/adjust-layout-dialog/adjust-layout-dialog.component';

@Component({
  selector: 'app-viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.scss'],
})
export class ViewerComponent implements OnInit {
  @ViewChild('videoPlayer', { static: false }) videoplayer!: HTMLVideoElement;

  public projectId!: string;

  public project$ = this.store.select(editorSelector.selectProject);

  // TODO layout according to this settings
  public videoArrangement$ = this.store.select(
    viewerSelector.selectVideoArrangement
  );
  public viewSelectionEnabled$ = this.store.select(
    viewerSelector.selectViewSelectionEnabled
  );
  public transcriptEnabled$ = this.store.select(
    viewerSelector.selectTranscriptEnabled
  );
  public transcriptPosition$ = this.store.select(
    viewerSelector.selectTranscriptPosition
  );

  layoutSettings$ = combineLatest([
    this.videoArrangement$,
    this.transcriptEnabled$,
    this.transcriptPosition$,
  ]).pipe(
    map(([videoArrangement, transcriptEnabled, transcriptPosition]) => ({
      videoArrangement,
      transcriptEnabled,
      transcriptPosition,
    }))
  );

  constructor(
    private route: ActivatedRoute,
    private store: Store<AppState>,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.params['id'];

    this.store.dispatch(
      editorActions.findProjectFromViewer({ projectId: this.projectId })
    );
  }

  onOpenAdjustLayoutDialog() {
    this.dialog.open(AdjustLayoutDialogComponent);
  }
}
