import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { DeleteConfirmationService } from 'src/app/components/delete-confirmation-dialog/delete-confirmation.service';
import { FileSizePipe } from 'src/app/pipes/file-size-pipe/file-size.pipe';
import { UserEntityForAdmin } from 'src/app/services/api/entities/user.entity';
import { ConfigService } from 'src/app/services/config/config.service';
import { AppState } from 'src/app/store/app.state';
import * as adminActions from '../../store/actions/admin.actions';
import * as adminSelectors from '../../store/selectors/admin.selector';
import { LandingFooterComponent } from '../landing/components/landing-footer/landing-footer.component';
import { LandingHeaderComponent } from '../landing/components/landing-header/landing-header.component';
import { DialogAdminEditEmailComponent } from './components/dialog-admin-edit-email/dialog-admin-edit-email.component';

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
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit, OnDestroy {
  isLoggedIn$ = this.store.select(adminSelectors.isLoggedIn);
  allUsers$ = this.store.select(adminSelectors.selectAllUsers);

  disableLandingPage = this.configService.getDisableLandingPage();

  private destroy$$ = new Subject<void>();

  password = new FormControl('', [Validators.required]);

  displayedColumns: string[] = [
    'username',
    'email',
    'projects',
    'filesize-total',
    'playback-total',
    'more',
  ];
  dataSource: UserEntityForAdmin[] = [];

  constructor(
    private store: Store<AppState>,
    private configService: ConfigService,
    private deleteService: DeleteConfirmationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.allUsers$.pipe(takeUntil(this.destroy$$)).subscribe((allUsers) => {
      const users = allUsers?.users ?? [];
      this.dataSource = [...users];
    });
  }

  onHandleLogin() {
    if (this.password.invalid) {
      this.password.markAsTouched();
      return;
    }

    const username = 'admin'; // TODO Team discussion necessary
    const password = this.password.value!;

    this.store.dispatch(adminActions.adminLogin({ username, password }));

    this.password.reset();
  }

  onHandleLogout() {
    this.store.dispatch(adminActions.adminLogout());
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

  async onDeleteUser(user: UserEntityForAdmin) {
    const isConfirmed = await this.deleteService.adminDeleteAccount(user.email);

    if (isConfirmed) {
      this.store.dispatch(
        adminActions.adminDeleteUserAccount({ userId: user.id })
      );
    }
  }

  ngOnDestroy(): void {
    // TODO logout here?
    this.destroy$$.next();
  }
}
