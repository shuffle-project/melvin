import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { CaptionEntity } from '../../../../../../../../services/api/entities/caption.entity';
import { MatButtonModule } from '@angular/material/button';

interface CaptionDeleteConfirmModalData {
  caption: CaptionEntity;
}

export interface CaptionDeleteConfirmModalResult {
  delete: boolean;
}

@Component({
    selector: 'app-caption-delete-confirm-modal',
    templateUrl: './caption-delete-confirm-modal.component.html',
    styleUrls: ['./caption-delete-confirm-modal.component.scss'],
    standalone: true,
    imports: [
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions,
        MatButtonModule,
    ],
})
export class CaptionDeleteConfirmModalComponent implements OnInit {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CaptionDeleteConfirmModalData,
    private dialogRef: MatDialogRef<CaptionDeleteConfirmModalComponent>
  ) {}

  ngOnInit(): void {}

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
