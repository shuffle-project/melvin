import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import {
  MatDialog,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioChange, MatRadioModule } from '@angular/material/radio';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import {
  MatSlideToggleChange,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import * as viewerActions from '../../../../store/actions/viewer.actions';
import { AppState } from '../../../../store/app.state';
import * as viewerSelector from '../../../../store/selectors/viewer.selector';
import { TranscriptPosition } from '../../../viewer/viewer.interfaces';
import { SizeOptions } from '../captions-settings-dialog/captions-settings-dialog.component';

@Component({
  selector: 'app-adjust-layout-dialog',
  templateUrl: './adjust-layout-dialog.component.html',
  styleUrls: ['./adjust-layout-dialog.component.scss'],
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatButtonModule,
    MatDialogClose,
    MatIconModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatRadioModule,
    PushPipe,
  ],
})
export class AdjustLayoutDialogComponent {
  public SizeOptions = SizeOptions;
  public TranscriptPosition = TranscriptPosition;

  public transcriptEnabled$ = this.store.select(
    viewerSelector.vTranscriptEnabled
  );
  public transcriptFontsize$ = this.store.select(
    viewerSelector.vTranscriptFontsize
  );
  public transcriptPosition$ = this.store.select(
    viewerSelector.vTranscriptPosition
  );

  public transcriptOnlyMode$ = this.store.select(
    viewerSelector.vTranscriptOnly
  );

  constructor(
    public dialogRef: MatDialogRef<AdjustLayoutDialogComponent>,
    public store: Store<AppState>,
    public dialog: MatDialog
  ) {}

  onChangeFontsize(event: MatSelectChange) {
    this.store.dispatch(
      viewerActions.changeTranscriptFontsize({
        transcriptFontsize: event.value,
      })
    );
  }

  onTranscriptPositionChanged(event: MatRadioChange) {
    this.store.dispatch(
      viewerActions.changeTranscriptPositionControls({
        transcriptPosition: event.value,
      })
    );
  }

  onTranscriptOnlyModeChanged(event: MatSlideToggleChange) {
    this.store.dispatch(viewerActions.toggleTranscriptOnlyMode());
  }
}
