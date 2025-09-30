import { Component, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { lastValueFrom } from 'rxjs';
import { ApiService } from 'src/app/services/api/api.service';
import { LandingFooterComponent } from '../landing/components/landing-footer/landing-footer.component';
import { LandingHeaderComponent } from '../landing/components/landing-header/landing-header.component';

@Component({
  selector: 'app-verify-email',
  imports: [
    LandingHeaderComponent,
    LandingFooterComponent,
    MatProgressSpinnerModule,
  ],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss',
})
export class VerifyEmailComponent implements OnInit {
  token: string | null = null;
  email: string | null = null;

  loading = false;
  error: null | string = null;

  constructor(private api: ApiService) {
    const urlParams = new URLSearchParams(window.location.search);
    this.token = urlParams.get('token');
    this.email = urlParams.get('email');
  }

  async ngOnInit() {
    if (this.token && this.email) {
      try {
        this.loading = true;
        const response = await lastValueFrom(
          this.api.verifyEmail(this.token, this.email)
        );
        console.log(response);

        if (response.token) {
          this.loading = false;
        }
      } catch (error) {
        this.loading = false;
        this.error = (error as any)?.error?.message || (error as any)?.message;
      }
    }
  }
}
