import { Component, inject, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { UserEntityForAdmin } from 'src/app/services/api/entities/user.entity';
import { AppState } from 'src/app/store/app.state';
import * as adminActions from '../../../../store/actions/admin.actions';
import * as adminSelectors from '../../../../store/selectors/admin.selector';

@Component({
  selector: 'app-dialog-admin-edit-email',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatInputModule,
    PushPipe,
    MatProgressSpinnerModule,
  ],
  templateUrl: './dialog-admin-edit-email.component.html',
  styleUrl: './dialog-admin-edit-email.component.scss',
})
export class DialogAdminEditEmailComponent implements OnDestroy {
  public user = inject<UserEntityForAdmin>(MAT_DIALOG_DATA);

  newEmailLoading$ = this.store.select(adminSelectors.selectNewEmailLoading);
  newEmailError$ = this.store.select(adminSelectors.selectNewEmailError);
  userWithNewEmail$ = this.store.select(adminSelectors.selectUserWithNewEmail);

  newEmailControl = new FormControl('', [
    Validators.required,
    Validators.email,
  ]);

  constructor(
    private dialogRef: MatDialogRef<DialogAdminEditEmailComponent>,
    private store: Store<AppState>
  ) {}

  onChangeEmail() {
    if (this.newEmailControl.invalid) {
      this.newEmailControl.markAsTouched();
      return;
    }

    const newEmail = this.newEmailControl.getRawValue()?.trim();

    this.store.dispatch(
      adminActions.adminUpdateUserEmail({
        userId: this.user.id,
        email: newEmail!,
      })
    );
  }

  ngOnDestroy(): void {
    this.store.dispatch(adminActions.adminClearUpdateUserEmail());
  }
}
