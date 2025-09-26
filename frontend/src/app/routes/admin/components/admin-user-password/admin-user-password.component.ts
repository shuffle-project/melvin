import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AlertService } from 'src/app/services/alert/alert.service';
import { ConfigService } from 'src/app/services/config/config.service';

@Component({
  selector: 'app-admin-user-password',
  imports: [MatIconModule, MatInputModule, MatButtonModule],
  templateUrl: './admin-user-password.component.html',
  styleUrl: './admin-user-password.component.scss',
})
export class AdminUserPasswordComponent {
  @Input() password!: string;
  @Input() username!: string;
  @Input() email!: string;

  frontendBaseURL = this.configService.getFrontendBaseUrl();

  constructor(
    private configService: ConfigService,
    private alertService: AlertService
  ) {}

  onSendEmail(password: string) {
    const to = this.email;
    const subject = '[Melvin] Your password has been reset';

    const body = this._returnEmailBody(password);

    window.location.href = `mailto:${to}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  }

  onCopyPasswordToClipboard(password: string) {
    navigator.clipboard
      .writeText(password)
      .then(() => {
        this.alertService.success(
          $localize`:@@dialogAdminResetPasswordPasswordCopiedToClipboard:Password copied to clipboard`
        );
      })
      .catch((err) => console.error('Could not copy password: ', err));
  }

  onCopyTextToClipboard(password: string) {
    const body = this._returnEmailBody(password);
    navigator.clipboard
      .writeText(body)
      .then(() =>
        this.alertService.success(
          $localize`:@@dialogAdminResetPasswordEmailCopiedToClipboard:Email text copied to clipboard`
        )
      )
      .catch((err) => console.error('Could not copy email text: ', err));
  }

  _returnEmailBody(password: string) {
    return `Hello ${this.username},

Your password has been reset by an administrator. Your new password is: 
${password}

Please log in and change your password as soon as possible: ${this.frontendBaseURL}

Best regards,`;
  }
}
