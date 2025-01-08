import { NgStyle } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import {
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { LetDirective } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';
import * as viewerActions from '../../../../store/actions/viewer.actions';
import { AppState } from '../../../../store/app.state';
import * as viewerSelector from '../../../../store/selectors/viewer.selector';

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
  P200 = '200',
}

export enum CaptionPositionOptions {
  UNDER_VIDEO = 'under-video',
  OVER_VIDEO = 'over-video',
}

@Component({
    selector: 'app-captions-settings-dialog',
    templateUrl: './captions-settings-dialog.component.html',
    styleUrls: ['./captions-settings-dialog.component.scss'],
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
        NgStyle,
    ]
})
export class CaptionsSettingsDialogComponent {
  ColorOptions = ColorOptions;
  SizeOptions = SizeOptions;
  CaptionPositionOptions = CaptionPositionOptions;

  backgroundColor$ = this.store.select(viewerSelector.vCaptionsBackgroundColor);
  color$ = this.store.select(viewerSelector.vCaptionsColor);
  fontsize$ = this.store.select(viewerSelector.vCaptionFontsize);
  position$ = this.store.select(viewerSelector.vCaptionPosition);

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
