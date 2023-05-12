import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
// use own viewer actions
import { MatDialog } from '@angular/material/dialog';
import { DurationPipe } from '../../../pipes/duration-pipe/duration.pipe';
import * as viewerActions from '../../../store/actions/viewer.actions';
import { AppState } from '../../../store/app.state';
import { selectProject } from '../../../store/selectors/viewer.selector';
import { AdjustLayoutDialogComponent } from './components/adjust-layout-dialog/adjust-layout-dialog.component';

@Component({
  selector: 'app-viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.scss'],
})
export class ViewerComponent implements OnInit {
  @ViewChild('videoPlayer', { static: false }) videoplayer!: HTMLVideoElement;

  public projectId!: string;

  public project$ = this.store.select(selectProject);

  // controls
  public volume: number = 1;

  constructor(
    private route: ActivatedRoute,
    private store: Store<AppState>,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.params['id'];

    this.store.dispatch(
      viewerActions.findProject({ projectId: this.projectId })
    );
  }

  sliderLabelTime(value: number): string {
    return new DurationPipe().transform(value * 1000);
  }

  sliderLabelVolume(value: number): string {
    return Math.round(value * 100) + '%';
  }

  onOpenAdjustLayoutDialog() {
    this.dialog.open(AdjustLayoutDialogComponent);
  }
}
