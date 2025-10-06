import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
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
  newEmailControl = new FormControl('', [
    Validators.required,
    Validators.email,
  ]);

  constructor(private api: ApiService) {}

  async ngOnInit() {
    // await this.api.requestResetPassword();
  }

  async onResetPasswordRequest() {
    if (this.newEmailControl.invalid) {
      this.newEmailControl.markAsTouched();
      return;
    }

    const newEmail = this.newEmailControl.getRawValue()?.trim();

    await firstValueFrom(this.api.requestResetPassword(newEmail!));

    // this.store.dispatch(
    //   adminActions.adminUpdateUserEmail({
    //     userId: this.user.id,
    //     email: newEmail!,
    //   })
    // );
  }
}
