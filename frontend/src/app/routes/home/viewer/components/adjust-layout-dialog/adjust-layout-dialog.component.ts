import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatRadioChange } from '@angular/material/radio';
import { MatSelectChange } from '@angular/material/select';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Store } from '@ngrx/store';
import * as viewerActions from '../../../../../store/actions/viewer.actions';
import { AppState } from '../../../../../store/app.state';
import * as viewerSelector from '../../../../../store/selectors/viewer.selector';
import {
  TranscriptFontsize,
  TranscriptPosition,
  VideoArrangement,
} from '../../viewer.interfaces';

@Component({
  selector: 'app-adjust-layout-dialog',
  templateUrl: './adjust-layout-dialog.component.html',
  styleUrls: ['./adjust-layout-dialog.component.scss'],
})
export class AdjustLayoutDialogComponent {
  public VideoArrangement = VideoArrangement;
  public TranscriptFontsize = TranscriptFontsize;
  public TranscriptPosition = TranscriptPosition;

  public videoArrangement$ = this.store.select(
    viewerSelector.selectVideoArrangement
  );
  public viewSelectionEnabled$ = this.store.select(
    viewerSelector.selectViewSelectionEnabled
  );
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
    public store: Store<AppState>
  ) {}

  onChangeVideoArrangement(event: MatRadioChange) {
    this.store.dispatch(
      viewerActions.changeVideoArrangement({ videoArrangement: event.value })
    );
  }

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

  onViewSelectionEnabledChange(event: MatSlideToggleChange) {
    this.store.dispatch(
      viewerActions.changeViewSelectionEnabled({
        viewSelectionEnabled: event.checked,
      })
    );
  }
}