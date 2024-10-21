import { Component, OnDestroy, OnInit } from '@angular/core';
import { NonNullableFormBuilder } from '@angular/forms';
import {
  MatSlideToggleChange,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { AppState } from '../../../../../store/app.state';
import * as editorSelectors from '../../../../../store/selectors/editor.selector';
import * as editorActions from './../../../../../store/actions/editor.actions';
import { FeatureEnabledPipe } from '../../../../../pipes/feature-enabled-pipe/feature-enabled.pipe';
import { LetDirective, PushPipe } from '@ngrx/component';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  MatCheckboxChange,
  MatCheckboxModule,
} from '@angular/material/checkbox';

@Component({
  selector: 'app-editor-settings',
  templateUrl: './editor-settings.component.html',
  styleUrls: ['./editor-settings.component.scss'],
  standalone: true,
  imports: [
    MatSlideToggleModule,
    PushPipe,
    FeatureEnabledPipe,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    LetDirective,
    MatCheckboxModule,
  ],
})
export class EditorSettingsComponent implements OnInit, OnDestroy {
  private destroy$$ = new Subject<void>();

  public isCaptionTextValidationEnabled$ = this.store.select(
    editorSelectors.selectCaptionTextValidationEnabled
  );

  public showUsernames$ = this.store.select(
    editorSelectors.selectShowUsernames
  );
  public selectSpellchecking$ = this.store.select(
    editorSelectors.selectSpellchecking
  );

  constructor(
    private store: Store<AppState>,
    private fb: NonNullableFormBuilder
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$$.next();
  }

  onToggleUsernames() {
    this.store.dispatch(editorActions.toggleShowUsernames());
  }

  onChangeIsCaptionTextValidationEnabled(change: MatSlideToggleChange) {
    this.store.dispatch(
      editorActions.setCaptionTextValidationEnabled({ enabled: change.checked })
    );
  }

  onChangeSpellchecking(change: MatCheckboxChange) {
    this.store.dispatch(
      editorActions.changeSpellchecking({ spellchecking: change.checked })
    );
  }
}
