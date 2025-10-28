import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { lastValueFrom } from 'rxjs';
import { ApiService } from 'src/app/services/api/api.service';
import { StorageService } from 'src/app/services/storage/storage.service';
import {
  DeleteConfirmData,
  DeleteConfirmLevel,
  DeleteConfirmResult,
} from './delete-confirmation.service';

@Component({
  selector: 'app-delete-confirmation-dialog',
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule,
  ],
  templateUrl: './delete-confirmation-dialog.component.html',
  styleUrl: './delete-confirmation-dialog.component.scss',
})
export class DeleteConfirmationDialogComponent {
  data = inject<DeleteConfirmData>(MAT_DIALOG_DATA);
  DeleteConfirmLevel = DeleteConfirmLevel;
  error = '';

  public passwordFormGroup: FormGroup = this.fb.group({
    password: this.fb.control('', Validators.required),
  });

  public typeControl = new FormControl('', [
    Validators.required,
    Validators.pattern(/^Delete$/),
  ]);

  constructor(
    private dialogRef: MatDialogRef<
      DeleteConfirmationDialogComponent,
      DeleteConfirmResult
    >,
    private fb: NonNullableFormBuilder,
    private api: ApiService,
    private storage: StorageService
  ) {}

  async onConfirm() {
    this.error = '';

    if (
      this.data.level === DeleteConfirmLevel.HIGH_TYPE &&
      this.typeControl.invalid
    ) {
      this.typeControl.markAsTouched();
      return;
    } else if (
      this.data.level === DeleteConfirmLevel.HIGH_PASSWORD &&
      this.passwordFormGroup.invalid
    ) {
      this.passwordFormGroup.markAllAsTouched();
      return;
    } else if (
      this.data.level === DeleteConfirmLevel.HIGH_PASSWORD &&
      this.passwordFormGroup.valid
    ) {
      try {
        const password: string = this.passwordFormGroup.value.password;
        await lastValueFrom(this.api.deleteAccount(password));

        this.dialogRef.close({
          delete: true,
        });
      } catch (error) {
        if (
          (error as HttpErrorResponse).error.code === 'password_is_incorrect'
        ) {
          this.error = $localize`:@@deleteConfirmationDialogPasswordIsIncorrect:Password is incorrect`;
        } else {
          this.error = (error as HttpErrorResponse).message;
        }
      }
    } else {
      this.dialogRef.close({
        delete: true,
      });
    }
  }

  onAbort() {
    this.dialogRef.close({
      delete: false,
    });
  }
}
