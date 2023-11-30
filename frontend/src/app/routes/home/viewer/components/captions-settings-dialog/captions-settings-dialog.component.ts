import { Component } from '@angular/core';
import { MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogClose } from '@angular/material/dialog';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';
import * as viewerActions from '../../../../../store/actions/viewer.actions';
import { AppState } from '../../../../../store/app.state';
import * as viewerSelector from '../../../../../store/selectors/viewer.selector';
import { NgStyle } from '@angular/common';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { LetDirective } from '@ngrx/component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export enum ColorOptions {
  BLACK = 'black',
  WHITE = 'white',
  YELLOW = 'yellow',
  BLUE = 'blue',
  RED = 'red',
  TRANSPARENT = 'transparent',
}

export enum SizeOptions {
  P80 = '80',
  P100 = '100',
  P120 = '120',
  P140 = '140',
  P160 = '160',
  P180 = '180',
}

export enum CaptionPositionOptions {
  UNDER_VIDEO = 'under-video',
  OVER_VIDEO = 'over-video',
}

@Component({
    selector: 'app-captions-settings-dialog',
    templateUrl: './captions-settings-dialog.component.html',
    styleUrls: ['./captions-settings-dialog.component.scss'],
    standalone: true,
    imports: [
    MatDialogTitle,
    MatDialogContent,
    MatButtonModule,
    MatDialogClose,
    MatIconModule,
    LetDirective,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    NgStyle
],
})
export class CaptionsSettingsDialogComponent {
  ColorOptions = ColorOptions;
  SizeOptions = SizeOptions;
  CaptionPositionOptions = CaptionPositionOptions;

  backgroundColor$ = this.store.select(
    viewerSelector.selectCaptionsBackgroundColor
  );
  color$ = this.store.select(viewerSelector.selectCaptionsColor);
  fontsize$ = this.store.select(viewerSelector.selectCaptionFontsize);
  position$ = this.store.select(viewerSelector.selectCaptionPosition);

  combined$ = combineLatest([
    this.backgroundColor$,
    this.color$,
    this.fontsize$,
    this.position$,
  ]).pipe(
    map(([backgroundColor, color, fontsize, position]) => {
      return { backgroundColor, color, fontsize, position };
    })
  );

  constructor(
    public dialogRef: MatDialogRef<CaptionsSettingsDialogComponent>,
    public store: Store<AppState>
  ) {}

  onChangeBackgroundColor(event: MatSelectChange) {
    this.store.dispatch(
      viewerActions.changeCaptionsBackgroundColor({
        captionsBackgroundColor: event.value,
      })
    );
  }

  onChangeColor(event: MatSelectChange) {
    this.store.dispatch(
      viewerActions.changeCaptionsColor({ captionsColor: event.value })
    );
  }

  onChangeFontsize(event: MatSelectChange) {
    this.store.dispatch(
      viewerActions.changeCaptionsFontsize({
        captionsFontsize: event.value,
      })
    );
  }

  onChangePosition(event: MatSelectChange) {
    this.store.dispatch(
      viewerActions.changeCaptionsPosition({
        captionsPosition: event.value,
      })
    );
  }
}
