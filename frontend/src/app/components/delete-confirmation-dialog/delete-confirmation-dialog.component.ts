import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import {
  DeleteConfirmData,
  DeleteConfirmResult,
} from './delete-confirmation.service';

@Component({
  selector: 'app-delete-confirmation-dialog',
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
  ],
  templateUrl: './delete-confirmation-dialog.component.html',
  styleUrl: './delete-confirmation-dialog.component.scss',
})
export class DeleteConfirmationDialogComponent {
  data = inject<DeleteConfirmData>(MAT_DIALOG_DATA);

  constructor(
    private dialogRef: MatDialogRef<
      DeleteConfirmationDialogComponent,
      DeleteConfirmResult
    >
  ) {}

  onConfirm() {
    this.dialogRef.close({
      delete: true,
    });
  }

  onAbort() {
    this.dialogRef.close({
      delete: false,
    });
  }
}
