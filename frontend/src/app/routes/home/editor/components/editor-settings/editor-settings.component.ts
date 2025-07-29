import { Component, OnDestroy, OnInit } from '@angular/core';
import { NonNullableFormBuilder } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatCheckboxChange,
  MatCheckboxModule,
} from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  MatSlideToggleChange,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import { LetDirective } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import * as editorActions from '../../../../../store/actions/editor.actions';
import { AppState } from '../../../../../store/app.state';
import * as editorSelectors from '../../../../../store/selectors/editor.selector';
import { DialogSpellcheckInfoComponent } from '../dialog-spellcheck-info/dialog-spellcheck-info/dialog-spellcheck-info.component';

@Component({
  selector: 'app-editor-settings',
  templateUrl: './editor-settings.component.html',
  styleUrls: ['./editor-settings.component.scss'],
  imports: [
    MatSlideToggleModule,
    MatIconModule,
    MatButtonModule,
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
    private fb: NonNullableFormBuilder,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$$.next();
  }

  onOpenDialogSpellcheckInfo() {
    this.dialog.open(DialogSpellcheckInfoComponent);
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
