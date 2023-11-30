import { Component } from '@angular/core';
import { MatDialog, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogClose } from '@angular/material/dialog';
import { MatRadioChange, MatRadioModule } from '@angular/material/radio';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Store } from '@ngrx/store';
import * as viewerActions from '../../../../../store/actions/viewer.actions';
import { AppState } from '../../../../../store/app.state';
import * as viewerSelector from '../../../../../store/selectors/viewer.selector';
import { TranscriptPosition } from '../../viewer.interfaces';
import { SizeOptions } from '../captions-settings-dialog/captions-settings-dialog.component';
import { PushPipe } from '@ngrx/component';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

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
    PushPipe
],
})
export class AdjustLayoutDialogComponent {
  public SizeOptions = SizeOptions;
  public TranscriptPosition = TranscriptPosition;

  public transcriptEnabled$ = this.store.select(
    viewerSelector.selectTranscriptEnabled
  );
  public transcriptFontsize$ = this.store.select(
    viewerSelector.selectTranscriptFontsize
  );
  public transcriptPosition$ = this.store.select(
    viewerSelector.selectTranscriptPosition
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
      viewerActions.changeTranscriptPosition({
        transcriptPosition: event.value,
      })
    );
  }

  onTranscriptEnabledChanged(event: MatSlideToggleChange) {
    this.store.dispatch(
      viewerActions.changeTranscriptEnabled({
        transcriptEnabled: event.checked,
      })
    );
  }
}
