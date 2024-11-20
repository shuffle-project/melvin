import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-reset-password-dialog',
    imports: [MatDialogModule, MatButtonModule, MatIconModule],
    templateUrl: './reset-password-dialog.component.html',
    styleUrl: './reset-password-dialog.component.scss'
})
export class ResetPasswordDialogComponent {}
