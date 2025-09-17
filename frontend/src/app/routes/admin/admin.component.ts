import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store/app.state';
import * as adminActions from '../../store/actions/admin.actions';
import * as adminSelectors from '../../store/selectors/admin.selector';
import { LandingFooterComponent } from '../landing/components/landing-footer/landing-footer.component';

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
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent {
  isLoggedIn$ = this.store.select(adminSelectors.isLoggedIn);
  allUsers$ = this.store.select(adminSelectors.selectAllUsers);

  password = new FormControl('', [Validators.required]);

  constructor(private store: Store<AppState>) {}

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
}
