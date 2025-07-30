import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ConfigService } from 'src/app/services/config/config.service';
import { LandingFooterComponent } from './components/landing-footer/landing-footer.component';
import { LandingHeaderComponent } from './components/landing-header/landing-header.component';
@Component({
  selector: 'app-landing',
  imports: [
    LandingHeaderComponent,
    LandingFooterComponent,
    RouterOutlet,
    MatSidenavModule,
    RouterLink,
    MatButtonModule,
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent {
  disableLandingPage = this.configService.getDisableLandingPage();

  constructor(private configService: ConfigService) {}
}
