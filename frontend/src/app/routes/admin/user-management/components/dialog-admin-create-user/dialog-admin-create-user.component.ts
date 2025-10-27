import { Component, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import * as adminActions from 'src/app/store/actions/admin.actions';
import { AppState } from 'src/app/store/app.state';
import * as adminSelector from 'src/app/store/selectors/admin.selector';
import { AdminUserPasswordComponent } from '../../../components/admin-user-password/admin-user-password.component';

@Component({
  selector: 'app-dialog-admin-create-user',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatInputModule,
    MatProgressSpinnerModule,
    PushPipe,
    AdminUserPasswordComponent,
  ],
  templateUrl: './dialog-admin-create-user.component.html',
  styleUrl: './dialog-admin-create-user.component.scss',
})
export class DialogAdminCreateUserComponent implements OnDestroy {
  newUserPassword$ = this.store.select(adminSelector.selectNewUserPassword);
  newUserPasswordLoading$ = this.store.select(
    adminSelector.selectNewUserPasswordLoading
  );
  passwordMethod$ = this.store.select(adminSelector.selectPasswordMethod);
  newUserError$ = this.store.select(adminSelector.selectNewUserError);

  emailControl = new FormControl('', [Validators.required, Validators.email]);
  usernameControl = new FormControl('', [Validators.required]);

  constructor(private store: Store<AppState>) {}

  onCreateUser() {
    if (this.emailControl.invalid || this.usernameControl.invalid) {
      this.emailControl.markAsTouched();
      this.usernameControl.markAsTouched();
      return;
    }

    const email = this.emailControl.value!;
    const username = this.usernameControl.value!;

    this.store.dispatch(
      adminActions.adminCreateUser({ email, name: username })
    );
  }

  ngOnDestroy(): void {
    this.store.dispatch(adminActions.adminClearUserPassword());
  }
}
