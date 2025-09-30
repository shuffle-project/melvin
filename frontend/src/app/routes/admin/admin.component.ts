import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { DeleteConfirmationService } from 'src/app/components/delete-confirmation-dialog/delete-confirmation.service';
import { DurationPipe } from 'src/app/pipes/duration-pipe/duration.pipe';
import { FileSizePipe } from 'src/app/pipes/file-size-pipe/file-size.pipe';
import { UserEntityForAdmin } from 'src/app/services/api/entities/user.entity';
import { ConfigService } from 'src/app/services/config/config.service';
import { AppState } from 'src/app/store/app.state';
import * as adminActions from '../../store/actions/admin.actions';
import * as adminSelectors from '../../store/selectors/admin.selector';
import { LandingFooterComponent } from '../landing/components/landing-footer/landing-footer.component';
import { LandingHeaderComponent } from '../landing/components/landing-header/landing-header.component';
import { DialogAdminCreateUserComponent } from './components/dialog-admin-create-user/dialog-admin-create-user.component';
import { DialogAdminEditEmailComponent } from './components/dialog-admin-edit-email/dialog-admin-edit-email.component';
import { DialogAdminResetPasswordComponent } from './components/dialog-admin-reset-password/dialog-admin-reset-password.component';

@Component({
  selector: 'app-admin',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    LandingFooterComponent,
    RouterLink,
    PushPipe,
    ReactiveFormsModule,
    MatTableModule,
    FileSizePipe,
    MatIconModule,
    LandingHeaderComponent,
    MatMenuModule,
    MatSortModule,
    DurationPipe,
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit, OnDestroy {
  isLoggedIn$ = this.store.select(adminSelectors.isLoggedIn);
  allUsers$ = this.store.select(adminSelectors.selectAllUsers);

  disableLandingPage = this.configService.getDisableLandingPage();

  loginError$ = this.store.select(adminSelectors.selectLoginError);

  private destroy$$ = new Subject<void>();

  usernameControl = new FormControl('', [Validators.required]);
  passwordControl = new FormControl('', [Validators.required]);

  displayedColumns: string[] = [
    'username',
    'email',
    'email-verified',
    'projects',
    'filesize-total',
    'playback-total',
    'more',
  ];

  dataSource: MatTableDataSource<UserEntityForAdmin> = new MatTableDataSource();
  @ViewChild(MatSort) sort!: MatSort;

  filteredUsersCount = 0;
  filterControl = new FormControl('');

  constructor(
    private store: Store<AppState>,
    private configService: ConfigService,
    private deleteService: DeleteConfirmationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.store.dispatch(adminActions.adminInit());

    this.allUsers$.pipe(takeUntil(this.destroy$$)).subscribe((allUsers) => {
      const users = allUsers?.users ?? [];
      this.dataSource = new MatTableDataSource([...users]);
      this.dataSource.sort = this.sort;

      this.filterControl.reset();
      this.filteredUsersCount = this.dataSource.filteredData.length;
    });
  }

  onVerifyUserEmail(user: UserEntityForAdmin) {
    this.store.dispatch(adminActions.adminVerifyUserEmail({ userId: user.id }));
  }

  onHandleLogin() {
    if (this.passwordControl.invalid || this.usernameControl.invalid) {
      this.passwordControl.markAsTouched();
      this.usernameControl.markAsTouched();
      return;
    }

    const username = this.usernameControl.value!;
    const password = this.passwordControl.value!;

    this.store.dispatch(adminActions.adminLogin({ username, password }));

    this.passwordControl.reset();
    this.usernameControl.reset();
  }

  onHandleLogout() {
    this.store.dispatch(adminActions.adminLogout());
  }

  onApplyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    this.filteredUsersCount = this.dataSource.filteredData.length;
  }

  onOpenCreateUserDialog() {
    this.dialog.open(DialogAdminCreateUserComponent, {
      disableClose: true,
      width: '100%',
      maxWidth: '40rem',
      maxHeight: '90vh',
    });
  }

  onOpenEditEmailDialog(user: UserEntityForAdmin) {
    this.dialog.open(DialogAdminEditEmailComponent, {
      data: user,
      disableClose: true,
      width: '100%',
      maxWidth: '30rem',
      maxHeight: '90vh',
    });
  }

  onOpenResetPasswordDialog(user: UserEntityForAdmin) {
    this.dialog.open(DialogAdminResetPasswordComponent, {
      data: user,
      disableClose: true,
      width: '100%',
      maxWidth: '40rem',
      maxHeight: '90vh',
    });
  }

  async onDeleteUser(user: UserEntityForAdmin) {
    const isConfirmed = await this.deleteService.adminDeleteAccount(user.email);

    if (isConfirmed) {
      this.store.dispatch(
        adminActions.adminDeleteUserAccount({ userId: user.id })
      );
    }
  }

  ngOnDestroy(): void {
    this.destroy$$.next();
  }
}
