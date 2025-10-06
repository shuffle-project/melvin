import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { lastValueFrom, Subject } from 'rxjs';
import { ApiService } from 'src/app/services/api/api.service';
import { AppState } from 'src/app/store/app.state';
import { LandingFooterComponent } from '../landing/components/landing-footer/landing-footer.component';
import { LandingHeaderComponent } from '../landing/components/landing-header/landing-header.component';

@Component({
  selector: 'app-reset-password',
  imports: [
    LandingHeaderComponent,
    LandingFooterComponent,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    ReactiveFormsModule,
    PushPipe,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  token: string | null = null;
  email: string | null = null;

  error: null | string = null;
  loading: boolean = false;
  success: boolean = false;

  private destroy$$ = new Subject<void>();

  resetPasswordError = '';

  resetPasswordForm = this.formBuilder.group(
    {
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
    private api: ApiService,
    private store: Store<AppState>,
    private formBuilder: NonNullableFormBuilder
  ) {
    const urlParams = new URLSearchParams(window.location.search);
    this.token = urlParams.get('token');
    this.email = urlParams.get('email');
  }
  ngOnInit(): void {}

  checkPasswords(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    const confirmPasswordDirty = control.get('confirmPassword')?.dirty;

    return confirmPasswordDirty && newPassword !== confirmPassword
      ? { notSame: true }
      : null;
  }

  async onSubmitResetPassword() {
    this.loading = true;
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    const dto = {
      email: this.email!,
      token: this.token!,
      password: this.resetPasswordForm.value.newPassword!,
    };
    console.log('submit', dto);

    try {
      const res = await lastValueFrom(this.api.resetPassword(dto));
      this.success = true;
    } catch (error) {
      const httpError = error as HttpErrorResponse;
      if (
        httpError.error.code === 'invalid_token' ||
        httpError.error.code === 'validation_error'
      ) {
        this.error =
          'Invalid token or email provided. Please check the link in your email or retry.';
      } else {
        this.error = 'Failed to reset password. Please try again.';
      }
    } finally {
      this.loading = false;
    }
  }
}
