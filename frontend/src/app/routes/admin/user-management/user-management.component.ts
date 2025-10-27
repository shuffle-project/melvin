import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { LetDirective, PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { DeleteConfirmationService } from 'src/app/components/delete-confirmation-dialog/delete-confirmation.service';
import { DurationPipe } from 'src/app/pipes/duration-pipe/duration.pipe';
import { FileSizePipe } from 'src/app/pipes/file-size-pipe/file-size.pipe';
import { AlertService } from 'src/app/services/alert/alert.service';
import { ApiService } from 'src/app/services/api/api.service';
import { UserEntityForAdmin } from 'src/app/services/api/entities/user.entity';
import { ConfigService } from 'src/app/services/config/config.service';
import * as adminActions from 'src/app/store/actions/admin.actions';
import { AppState } from 'src/app/store/app.state';
import * as adminSelectors from 'src/app/store/selectors/admin.selector';
import { LandingFooterComponent } from '../../landing/components/landing-footer/landing-footer.component';
import { LandingHeaderComponent } from '../../landing/components/landing-header/landing-header.component';
import { DialogAdminCreateUserComponent } from './components/dialog-admin-create-user/dialog-admin-create-user.component';
import { DialogAdminEditEmailComponent } from './components/dialog-admin-edit-email/dialog-admin-edit-email.component';
import { DialogAdminResetPasswordComponent } from './components/dialog-admin-reset-password/dialog-admin-reset-password.component';
import { DialogAdminUpdateUserComponent } from './components/dialog-admin-update-user/dialog-admin-update-user.component';

@Component({
  selector: 'app-user-management',
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
    LetDirective,
    MatSelectModule,
  ],
  providers: [],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss',
})
export class UserManagementComponent implements OnInit, AfterViewInit {
  allUsers$ = this.store.select(adminSelectors.selectAllUsers);
  allTeams$ = this.store.select(adminSelectors.selectAllTeams);

  private destroy$$ = new Subject<void>();

  displayedColumns: string[] = [
    'username',
    'email',
    'email-verified',
    'projects',
    'total-video-length',
    'filesize-total',
    'user-size-limit',
    'user-team',
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
    private dialog: MatDialog,
    private api: ApiService,
    private alterService: AlertService
  ) {}

  ngOnInit(): void {
    this.allUsers$.pipe(takeUntil(this.destroy$$)).subscribe((allUsers) => {
      const users = allUsers?.users ?? [];
      this.dataSource = new MatTableDataSource([...users]);
      this.dataSource.sort = this.sort;

      this.filterControl.reset();
      this.filteredUsersCount = this.dataSource.filteredData.length;
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  onVerifyUserEmail(user: UserEntityForAdmin) {
    this.store.dispatch(adminActions.adminVerifyUserEmail({ userId: user.id }));
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

  onOpenUpdateUserDialog(user: UserEntityForAdmin) {
    this.dialog.open(DialogAdminUpdateUserComponent, {
      disableClose: true,
      width: '100%',
      maxWidth: '40rem',
      maxHeight: '90vh',
      data: { user },
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

  async onChangeTeam(event: MatSelectChange<string>, user: UserEntityForAdmin) {
    try {
      await firstValueFrom(
        this.api.adminUpdateUser(user.id, { team: event.value ?? null })
      );
      this.store.dispatch(adminActions.adminFindAllTeams());
    } catch (error) {
      const err = (error = error as HttpErrorResponse);
      this.alterService.error(err.error?.message || err.message);
    }
  }
}
