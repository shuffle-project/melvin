import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { FileSizePipe } from 'src/app/pipes/file-size-pipe/file-size.pipe';
import { UserEntityForAdmin } from 'src/app/services/api/entities/user.entity';
import { ConfigService } from 'src/app/services/config/config.service';
import { AppState } from 'src/app/store/app.state';
import * as adminActions from '../../store/actions/admin.actions';
import * as adminSelectors from '../../store/selectors/admin.selector';
import { LandingFooterComponent } from '../landing/components/landing-footer/landing-footer.component';
import { LandingHeaderComponent } from '../landing/components/landing-header/landing-header.component';

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
    'filesize-total',
    'edit',
    'delete',
  ];
  dataSource: UserEntityForAdmin[] = [];

  constructor(
    private store: Store<AppState>,
    private configService: ConfigService
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

    this.store.dispatch(adminActions.loginAdmin({ username, password }));

    this.password.reset();
  }

  onHandleLogout() {
    this.store.dispatch(adminActions.logoutAdmin());
  }

  onEditUser(user: UserEntityForAdmin) {
    console.log(user);
  }

  onDeleteUser(user: UserEntityForAdmin) {
    console.log(user);
  }

  ngOnDestroy(): void {
    // TODO logout here?
    this.destroy$$.next();
  }
}
