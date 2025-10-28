import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import { ApiService } from 'src/app/services/api/api.service';
import * as adminActions from 'src/app/store/actions/admin.actions';
import { AppState } from 'src/app/store/app.state';
import { gbToBytes } from '../../../utils';

@Component({
  selector: 'app-dialog-admin-create-team',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './dialog-admin-create-team.component.html',
  styleUrl: './dialog-admin-create-team.component.scss',
})
export class DialogAdminCreateTeamComponent implements OnDestroy {
  teamnameControl = new FormControl('', [Validators.required]);
  sizelimitControl = new FormControl(1, [Validators.required]);

  loading = false;
  error: string | null = null;

  constructor(
    private store: Store<AppState>,
    private dialogRef: MatDialogRef<DialogAdminCreateTeamComponent>,
    private apiService: ApiService
  ) {}

  ngOnDestroy(): void {}

  async onCreateTeam() {
    if (this.teamnameControl.invalid || this.sizelimitControl.invalid) {
      this.teamnameControl.markAsTouched();
      this.sizelimitControl.markAsTouched();
      return;
    }

    const name = this.teamnameControl.value!;
    const sizeLimit = this.sizelimitControl.value!;

    try {
      this.loading = true;
      await firstValueFrom(
        this.apiService.adminCreateTeam({
          name,
          sizeLimit: gbToBytes(sizeLimit),
        })
      );
      this.loading = false;

      this.store.dispatch(adminActions.adminFindAllTeams());
      this.dialogRef.close();
    } catch (error) {
      const err = (error = error as HttpErrorResponse);
      this.error = err.error?.message || err.message;
    } finally {
      this.loading = false;
    }
  }
}
