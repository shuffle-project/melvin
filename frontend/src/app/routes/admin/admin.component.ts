import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { ConfigService } from 'src/app/services/config/config.service';
import { AppState } from 'src/app/store/app.state';
import * as adminActions from '../../store/actions/admin.actions';
import * as adminSelectors from '../../store/selectors/admin.selector';
import { LandingFooterComponent } from '../landing/components/landing-footer/landing-footer.component';
import { LandingHeaderComponent } from '../landing/components/landing-header/landing-header.component';
import { TeamManagementComponent } from './team-management/team-management.component';
import { UserManagementComponent } from './user-management/user-management.component';

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
    MatIconModule,
    LandingHeaderComponent,
    MatMenuModule,
    MatSortModule,
    MatTabsModule,
    TeamManagementComponent,
    UserManagementComponent,
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

  constructor(
    private store: Store<AppState>,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    this.store.dispatch(adminActions.adminInit());
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

  ngOnDestroy(): void {
    this.destroy$$.next();
  }
}
