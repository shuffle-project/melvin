import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { LetDirective } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { DeleteConfirmationService } from 'src/app/components/delete-confirmation-dialog/delete-confirmation.service';
import { UserInfoComponent } from 'src/app/components/user-info/user-info.component';
import { ApiService } from 'src/app/services/api/api.service';
import { ConfigService } from 'src/app/services/config/config.service';
import { logout } from 'src/app/store/actions/auth.actions';
import { HeaderComponent } from '../../../components/header/header.component';
import { AuthUser } from '../../../interfaces/auth.interfaces';
import * as authSelectors from '../../../store/selectors/auth.selector';
import { DialogChangePasswordComponent } from './components/dialog-change-password/dialog-change-password.component';
import { DialogChangeUsernameComponent } from './components/dialog-change-username/dialog-change-username.component';

interface PasswordChangeForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  imports: [
    HeaderComponent,
    LetDirective,
    MatSelectModule,
    ReactiveFormsModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    UserInfoComponent,
  ],
})
export class ProfileComponent implements OnInit {
  user$!: Observable<AuthUser | null>;

  locale = $localize.locale;

  constructor(
    private store: Store,
    private dialog: MatDialog,
    private confirmService: DeleteConfirmationService,
    private api: ApiService,
    private router: Router,
    private configService: ConfigService
  ) {}

  onLanguageSwitched(event: MatSelectChange) {
    document.location.href = `${this.configService.getFrontendBaseUrl()}/${
      event.value
    }/home/profile`;
  }

  ngOnInit() {
    this.user$ = this.store.select(authSelectors.selectUser);
  }

  onOpenChangePasswordDialog() {
    this.dialog.open(DialogChangePasswordComponent, {
      disableClose: true,
      width: '100%',
      maxWidth: '50rem',
      maxHeight: '90vh',
    });
  }

  onOpenChangeUsernameDialog() {
    this.dialog.open(DialogChangeUsernameComponent, {
      disableClose: true,
      width: '100%',
      maxWidth: '50rem',
      maxHeight: '90vh',
    });
  }

  async onDeleteAccount() {
    const deleteAccount = await this.confirmService.deleteAccount();

    if (deleteAccount) {
      this.store.dispatch(logout());
    }
  }
}
