import { HttpErrorResponse } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import { ApiService } from 'src/app/services/api/api.service';
import { AdminUpdateUserDto } from 'src/app/services/api/dto/admin-update-user.dto';
import { UserEntityForAdmin } from 'src/app/services/api/entities/user.entity';
import { adminFindAllUsers } from 'src/app/store/actions/admin.actions';
import { AppState } from 'src/app/store/app.state';
import { byteToGb, gbToBytes } from '../../../utils';

@Component({
  selector: 'app-dialog-admin-update-user',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatInputModule,
    MatProgressSpinnerModule,
    PushPipe,
  ],
  templateUrl: './dialog-admin-update-user.component.html',
  styleUrl: './dialog-admin-update-user.component.scss',
})
export class DialogAdminUpdateUserComponent {
  nameControl = new FormControl('', []);
  sizelimitControl = new FormControl(1, []);

  user: UserEntityForAdmin = this.data.user;

  loading = false;
  error: string | null = null;

  constructor(
    private store: Store<AppState>,
    private dialogRef: MatDialogRef<DialogAdminUpdateUserComponent>,
    private apiService: ApiService,
    @Inject(MAT_DIALOG_DATA) public data: { user: UserEntityForAdmin }
  ) {
    console.log(this.user);
    this.nameControl.setValue(this.user.name);
    this.sizelimitControl.setValue(byteToGb(this.user.sizeLimit));
  }

  async onEditUser() {
    if (this.nameControl.invalid || this.sizelimitControl.invalid) {
      this.nameControl.markAsTouched();
      this.sizelimitControl.markAsTouched();
      return;
    }

    try {
      this.loading = true;

      if (
        this.nameControl.value === this.user.name &&
        gbToBytes(this.sizelimitControl.value!) === this.user.sizeLimit
      ) {
        this.error = 'No changes made.';
        return;
      }

      const dto: AdminUpdateUserDto = {};
      if (
        this.nameControl.value &&
        this.nameControl.touched &&
        this.nameControl.value !== this.user.name
      ) {
        dto.name = this.nameControl.value;
      }

      if (
        this.sizelimitControl.value &&
        this.sizelimitControl.touched &&
        gbToBytes(this.sizelimitControl.value) !== this.user.sizeLimit
      ) {
        dto.sizeLimit = gbToBytes(this.sizelimitControl.value);
      }

      await firstValueFrom(this.apiService.adminUpdateUser(this.user.id, dto));
      this.loading = false;

      this.store.dispatch(adminFindAllUsers());
      this.dialogRef.close();
    } catch (error) {
      const err = (error = error as HttpErrorResponse);
      this.error = err.error?.message || err.message;
    } finally {
      this.loading = false;
    }
  }
}
