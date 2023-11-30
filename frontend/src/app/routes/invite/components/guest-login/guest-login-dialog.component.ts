import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogTitle, MatDialogContent } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
    selector: 'app-guest-login-dialog',
    templateUrl: './guest-login-dialog.component.html',
    styleUrls: ['./guest-login-dialog.component.scss'],
    standalone: true,
    imports: [
        MatDialogTitle,
        MatDialogContent,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatButtonModule,
    ],
})
export class GuestLoginDialogComponent implements OnInit {
  public formGroup!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private matDialogRef: MatDialogRef<GuestLoginDialogComponent>
  ) {}

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      name: this.fb.control<string>(''),
    });
  }

  onSubmit() {
    const { name } = this.formGroup.value;

    this.matDialogRef.close({
      name,
    });
  }
}
