import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-adjust-layout-dialog',
  templateUrl: './adjust-layout-dialog.component.html',
  styleUrls: ['./adjust-layout-dialog.component.scss'],
})
export class AdjustLayoutDialogComponent {
  constructor(public dialogRef: MatDialogRef<AdjustLayoutDialogComponent>) {}
}
