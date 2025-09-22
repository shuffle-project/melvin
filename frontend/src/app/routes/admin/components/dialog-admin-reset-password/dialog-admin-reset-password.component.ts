import { Component, inject, OnDestroy } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { UserEntityForAdmin } from 'src/app/services/api/entities/user.entity';
import { AppState } from 'src/app/store/app.state';
import * as adminActions from '../../../../store/actions/admin.actions';
import * as adminSelectors from '../../../../store/selectors/admin.selector';

@Component({
  selector: 'app-dialog-admin-reset-password',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatInputModule,
    PushPipe,
  ],
  templateUrl: './dialog-admin-reset-password.component.html',
  styleUrl: './dialog-admin-reset-password.component.scss',
})
export class DialogAdminResetPasswordComponent implements OnDestroy {
  newUserPassword$ = this.store.select(adminSelectors.selectNewUserPassword);
  public user = inject<UserEntityForAdmin>(MAT_DIALOG_DATA);

  constructor(private store: Store<AppState>) {}

  onResetPassword() {
    this.store.dispatch(
      adminActions.adminResetUserPassword({ userId: this.user.id })
    );
  }

  ngOnDestroy(): void {
    this.store.dispatch(adminActions.adminClearUserPassword());
  }
}
