import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { ConfigService } from 'src/app/services/config/config.service';
import { AppState } from 'src/app/store/app.state';
import * as authSelector from '../../../../store/selectors/auth.selector';
import { LoginComponent } from '../landing-header/components/login-dialog/login/login.component';

@Component({
  selector: 'app-landing-main',
  imports: [
    MatIconModule,
    LoginComponent,
    PushPipe,
    MatButtonModule,
    RouterLink,
  ],
  templateUrl: './landing-main.component.html',
  styleUrl: './landing-main.component.scss',
})
export class LandingMainComponent {
  public disableLandingPage = this.configService.getDisableLandingPage();
  public disableTutorialVideos = this.configService.getDisableTutorialVideos();

  public isLoggedIn$ = this.store.select(authSelector.selectIsLoggedIn);

  constructor(
    private configService: ConfigService,
    private store: Store<AppState>
  ) {}
}
