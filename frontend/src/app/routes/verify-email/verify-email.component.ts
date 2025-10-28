import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';
import { lastValueFrom } from 'rxjs';
import { ApiService } from 'src/app/services/api/api.service';
import { AppState } from 'src/app/store/app.state';
import * as authActions from '../../store/actions/auth.actions';
import { LandingFooterComponent } from '../landing/components/landing-footer/landing-footer.component';
import { LandingHeaderComponent } from '../landing/components/landing-header/landing-header.component';

@Component({
  selector: 'app-verify-email',
  imports: [
    LandingHeaderComponent,
    LandingFooterComponent,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss',
})
export class VerifyEmailComponent implements OnInit {
  token: string | null = null;
  email: string | null = null;

  error: null | string = null;
  success: boolean = false;

  constructor(private api: ApiService, private store: Store<AppState>) {
    const urlParams = new URLSearchParams(window.location.search);
    this.token = urlParams.get('token');
    this.email = urlParams.get('email');
  }

  async ngOnInit() {
    if (this.token && this.email) {
      try {
        const response = await lastValueFrom(
          this.api.verifyEmail(this.token, this.email)
        );

        if (response.token) {
          this.success = true;

          this.store.dispatch(
            authActions.verifyEmailSuccess({ token: response.token })
          );
        }
      } catch (e: any) {
        if (e.error.code === 'email_already_verified') {
          this.error = $localize`:@@verifyEmailErrorAlreadyVerified:Your email address has already been verified.`;
        } else {
          this.error = $localize`:@@verifyEmailErrorInvalidLink:Link is invalid.`;
        }
      }
    }
  }
}
