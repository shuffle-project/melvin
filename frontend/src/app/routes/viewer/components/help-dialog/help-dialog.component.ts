import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialog,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app.state';

@Component({
  selector: 'app-help-dialog',
  templateUrl: './help-dialog.component.html',
  styleUrls: ['./help-dialog.component.scss'],
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatButtonModule,
    MatDialogClose,
    MatIconModule,
    PushPipe,
  ],
})
export class HelpDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<HelpDialogComponent>,
    public store: Store<AppState>,
    public dialog: MatDialog
  ) {}
}
