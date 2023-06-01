import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';
import * as viewerActions from '../../../../../store/actions/viewer.actions';
import { AppState } from '../../../../../store/app.state';
import * as viewerSelector from '../../../../../store/selectors/viewer.selector';

export enum ColorOptions {
  BLACK = 'black',
  WHITE = 'white',
  YELLOW = 'yellow',
  BLUE = 'blue',
  RED = 'red',
}

export enum SizeOptions {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  LARGER = 'larger',
}

@Component({
  selector: 'app-captions-settings-dialog',
  templateUrl: './captions-settings-dialog.component.html',
  styleUrls: ['./captions-settings-dialog.component.scss'],
})
export class CaptionsSettingsDialogComponent {
  ColorOptions = ColorOptions;
  SizeOptions = SizeOptions;

  backgroundColor$ = this.store.select(
    viewerSelector.selectCaptionsBackgroundColor
  );
  color$ = this.store.select(viewerSelector.selectCaptionsColor);
  fontsize$ = this.store.select(viewerSelector.selectCaptionFontsize);

  combined$ = combineLatest([
    this.backgroundColor$,
    this.color$,
    this.fontsize$,
  ]).pipe(
    map(([backgroundColor, color, fontsize]) => {
      return { backgroundColor, color, fontsize };
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
}
