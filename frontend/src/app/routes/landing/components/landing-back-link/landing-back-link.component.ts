import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { ConfigService } from 'src/app/services/config/config.service';
import { AppState } from 'src/app/store/app.state';
import * as authSelector from '../../../../store/selectors/auth.selector';

@Component({
  selector: 'app-landing-back-link',
  imports: [MatButtonModule, RouterLink, PushPipe],
  templateUrl: './landing-back-link.component.html',
  styleUrl: './landing-back-link.component.scss',
})
export class LandingBackLinkComponent {
  disableLandingPage = this.configService.getDisableLandingPage();
  public isLoggedIn$ = this.store.select(authSelector.selectIsLoggedIn);

  constructor(
    private configService: ConfigService,
    private store: Store<AppState>
  ) {}
}
