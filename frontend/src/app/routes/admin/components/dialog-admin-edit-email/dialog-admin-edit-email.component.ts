import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Store } from '@ngrx/store';
import { UserEntityForAdmin } from 'src/app/services/api/entities/user.entity';
import { AppState } from 'src/app/store/app.state';
import * as adminActions from '../../../../store/actions/admin.actions';

@Component({
  selector: 'app-dialog-admin-edit-email',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatInputModule,
  ],
  templateUrl: './dialog-admin-edit-email.component.html',
  styleUrl: './dialog-admin-edit-email.component.scss',
})
export class DialogAdminEditEmailComponent {
  public user = inject<UserEntityForAdmin>(MAT_DIALOG_DATA);

  newEmailControl = new FormControl('', [
    Validators.required,
    Validators.email,
  ]);

  constructor(
    private dialogRef: MatDialogRef<DialogAdminEditEmailComponent>,
    private store: Store<AppState>
  ) {}

  onSaveChanges() {
    console.log('Save Changes', this.newEmailControl.value);
  }

  onAbort() {
    this.dialogRef.close();
  }

  onConfirm() {
    if (this.newEmailControl.invalid) {
      this.newEmailControl.markAsTouched();
      return;
    }

    const newEmail = this.newEmailControl.getRawValue()?.trim();

    this.store.dispatch(
      adminActions.adminUpdateUser({
        userId: this.user.id,
        email: newEmail!,
        name: this.user.name,
      })
    );

    // TODO wait here for fail or success before closing?
    this.dialogRef.close();
  }
}
