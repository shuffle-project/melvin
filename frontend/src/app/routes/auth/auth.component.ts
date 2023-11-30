import { Component } from '@angular/core';
import { FooterComponent } from '../../components/footer/footer.component';
import { PasswordResetComponent } from './components/password-reset/password-reset.component';
import { RegisterComponent } from './components/register/register.component';
import { LoginComponent } from './components/login/login.component';
import { MatButtonModule } from '@angular/material/button';
import { LogoComponent } from '../../components/logo/logo.component';
import { NgClass } from '@angular/common';

type View = 'login' | 'register' | 'password';

@Component({
    selector: 'app-auth',
    templateUrl: './auth.component.html',
    styleUrls: ['./auth.component.scss'],
    standalone: true,
    imports: [
    NgClass,
    LogoComponent,
    MatButtonModule,
    LoginComponent,
    RegisterComponent,
    PasswordResetComponent,
    FooterComponent
],
})
export class AuthComponent {
  public view: View = 'login';

  get toggleLabel(): string {
    switch (this.view) {
      case 'register':
        return $localize`:@@authToLoginFromRegisterLabel:Login`;
      case 'login':
        return $localize`:@@authToRegisterFromLoginLabel:Register`;
      case 'password':
        return $localize`:@@authToLoginFromPasswordResetLabel:Login`;
    }
  }

  constructor() {}

  onClickToggleView() {
    switch (this.view) {
      case 'password':
      case 'register':
        this.view = 'login';
        break;
      case 'login':
        this.view = 'register';
    }
  }

  onClickShowPasswordReset() {
    this.view = 'password';
  }
}
