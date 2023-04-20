import { Component, OnDestroy, OnInit } from '@angular/core';
import { NonNullableFormBuilder } from '@angular/forms';
import { MatLegacySlideToggleChange as MatSlideToggleChange } from '@angular/material/legacy-slide-toggle';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { AppState } from '../../../../../store/app.state';
import * as editorSelectors from '../../../../../store/selectors/editor.selector';
import * as editorActions from './../../../../../store/actions/editor.actions';

@Component({
  selector: 'app-editor-settings',
  templateUrl: './editor-settings.component.html',
  styleUrls: ['./editor-settings.component.scss'],
})
export class EditorSettingsComponent implements OnInit, OnDestroy {
  private destroy$$ = new Subject<void>();

  public isCaptionTextValidationEnabled$ = this.store.select(
    editorSelectors.selectCaptionTextValidationEnabled
  );

  constructor(
    private store: Store<AppState>,
    private fb: NonNullableFormBuilder
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$$.next();
  }

  onChangeIsCaptionTextValidationEnabled(change: MatSlideToggleChange) {
    this.store.dispatch(
      editorActions.setCaptionTextValidationEnabled({ enabled: change.checked })
    );
  }
}
