import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PushPipe } from '@ngrx/component';
import { firstValueFrom } from 'rxjs';
import { ApiService } from 'src/app/services/api/api.service';

@Component({
  selector: 'app-reset-password-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatInputModule,
    PushPipe,
    MatProgressSpinnerModule,
  ],
  templateUrl: './reset-password-dialog.component.html',
  styleUrl: './reset-password-dialog.component.scss',
})
export class ResetPasswordDialogComponent implements OnInit {
  public formGroup!: FormGroup;
  error: null | string = null;
  success: null | string = null;

  loading = false;

  constructor(private fb: NonNullableFormBuilder, private api: ApiService) {}

  async ngOnInit() {
    this.formGroup = this.fb.group({
      email: this.fb.control('', [Validators.required, Validators.email]),
    });
  }

  async onSubmit() {
    if (this.formGroup.controls['email'].invalid) {
      this.formGroup.controls['email'].markAsTouched();
      return;
    }
    this.loading = true;

    const newEmail = this.formGroup.controls['email'].getRawValue()?.trim();
    try {
      const res = await firstValueFrom(
        this.api.requestResetPassword(newEmail!)
      );
      this.error = null;
      this.success = $localize`:@@resetPasswordDialogSuccessMessage:A password reset email has been sent. You can now close this window.`;
    } catch (err) {
      this.success = null;
      let error = err as HttpErrorResponse;
      if (error?.error?.code === 'user_not_found') {
        // TODO fehlermeldung anzeigen?
        this.error = $localize`:@@resetPasswordDialogUserNotFoundError:No user found with that email`;
      } else if (error?.error?.code === 'forgot_password_disabled') {
        this.error = $localize`:@@resetPasswordDialogForgotPasswordDisabled:Forgot password is disabled for this app, please contact an administrator`;
      } else {
        this.error = $localize`:@@resetPasswordDialogGeneralError:Error sending reset password email`;
      }
      console.log(error);
    } finally {
      this.loading = false;
    }
  }
}
