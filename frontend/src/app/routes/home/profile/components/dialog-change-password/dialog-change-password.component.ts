import { Component, OnDestroy } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { AuthUser } from 'src/app/interfaces/auth.interfaces';
import { ChangePasswordDto } from 'src/app/services/api/dto/auth.dto';
import { AppState } from 'src/app/store/app.state';
import * as authActions from '../../../../../store/actions/auth.actions';
import * as authSelectors from '../../../../../store/selectors/auth.selector';

@Component({
  selector: 'app-dialog-change-password',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './dialog-change-password.component.html',
  styleUrl: './dialog-change-password.component.scss',
})
export class DialogChangePasswordComponent implements OnDestroy {
  userEmail = '';
  private destroy$$ = new Subject<void>();

  changePasswordError = '';

  changePasswordForm = this.formBuilder.group(
    {
      currentPassword: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      newPassword: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      confirmPassword: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: this.checkPasswords }
  );

  constructor(
    private store: Store<AppState>,
    private formBuilder: NonNullableFormBuilder
  ) {
    this.store
      .select(authSelectors.selectUser)
      .pipe(takeUntil(this.destroy$$))
      .subscribe((user: AuthUser | null) => {
        this.userEmail = user?.email || '';
      });

    this.store
      .select(authSelectors.selectChangePasswordError)
      .pipe(takeUntil(this.destroy$$))
      .subscribe((error) => {
        this.changePasswordError = error || '';
      });
  }

  checkPasswords(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    const confirmPasswordDirty = control.get('confirmPassword')?.dirty;

    return confirmPasswordDirty && newPassword !== confirmPassword
      ? { notSame: true }
      : null;
  }

  onSubmitChangePassword() {
    this.store.dispatch(authActions.clearChangePasswordError());

    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    const dto: ChangePasswordDto = {
      email: this.userEmail,
      oldPassword: this.changePasswordForm.value.currentPassword!,
      newPassword: this.changePasswordForm.value.newPassword!,
    };
    this.store.dispatch(authActions.changePassword({ dto }));
  }

  ngOnDestroy(): void {
    if (this.changePasswordError) {
      this.store.dispatch(authActions.clearChangePasswordError());
    }

    this.destroy$$.next();
  }
}
