import { Component } from '@angular/core';

type View = 'login' | 'register' | 'password';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
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
