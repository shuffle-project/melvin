import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-upload-information',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressBarModule,
    MatButtonModule,
  ],
  templateUrl: './upload-information.component.html',
  styleUrl: './upload-information.component.scss',
})
export class UploadInformationComponent {
  constructor(
    public dialogRef: MatDialogRef<UploadInformationComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { id: string; progress: number }[]
  ) {
    console.log(data);
  }
}