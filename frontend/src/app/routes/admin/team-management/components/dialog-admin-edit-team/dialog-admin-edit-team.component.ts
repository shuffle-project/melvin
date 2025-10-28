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
import { Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import { ApiService } from 'src/app/services/api/api.service';
import { UpdateTeamDto } from 'src/app/services/api/dto/team.dto';
import { TeamEntity } from 'src/app/services/api/entities/team.entity';
import { adminFindAllTeams } from 'src/app/store/actions/admin.actions';
import { AppState } from 'src/app/store/app.state';
import { byteToGb, gbToBytes } from '../../../utils';

@Component({
  selector: 'app-dialog-admin-edit-team',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './dialog-admin-edit-team.component.html',
  styleUrl: './dialog-admin-edit-team.component.scss',
})
export class DialogAdminEditTeamComponent {
  teamnameControl = new FormControl('', []);
  sizelimitControl = new FormControl(1, []);

  team: TeamEntity = this.data.team;

  loading = false;
  error: string | null = null;

  constructor(
    private store: Store<AppState>,
    private dialogRef: MatDialogRef<DialogAdminEditTeamComponent>,
    private apiService: ApiService,
    @Inject(MAT_DIALOG_DATA) public data: { team: TeamEntity }
  ) {
    this.teamnameControl.setValue(this.team.name);
    this.sizelimitControl.setValue(byteToGb(this.team.sizeLimit));
  }

  async onEditTeam() {
    if (this.teamnameControl.invalid || this.sizelimitControl.invalid) {
      this.teamnameControl.markAsTouched();
      this.sizelimitControl.markAsTouched();
      return;
    }

    try {
      this.loading = true;

      if (
        this.teamnameControl.value === this.team.name &&
        gbToBytes(this.sizelimitControl.value!) === this.team.sizeLimit
      ) {
        this.error = 'No changes made.';
        return;
      }

      const dto: UpdateTeamDto = {};
      if (
        this.teamnameControl.value &&
        this.teamnameControl.touched &&
        this.teamnameControl.value !== this.team.name
      ) {
        dto.name = this.teamnameControl.value;
      }

      if (
        this.sizelimitControl.value &&
        this.sizelimitControl.touched &&
        gbToBytes(this.sizelimitControl.value) !== this.team.sizeLimit
      ) {
        dto.sizeLimit = gbToBytes(this.sizelimitControl.value);
      }

      await firstValueFrom(this.apiService.adminUpdateTeam(this.team.id, dto));
      this.loading = false;

      this.store.dispatch(adminFindAllTeams());
      this.dialogRef.close();
    } catch (error) {
      const err = (error = error as HttpErrorResponse);
      this.error = err.error?.message || err.message;
    } finally {
      this.loading = false;
    }
  }
}
