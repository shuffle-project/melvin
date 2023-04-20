import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';

@Component({
  selector: 'app-guest-login-dialog',
  templateUrl: './guest-login-dialog.component.html',
  styleUrls: ['./guest-login-dialog.component.scss'],
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
