import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { LogoComponent } from 'src/app/components/logo/logo.component';
import { FeatureEnabledPipe } from 'src/app/pipes/feature-enabled-pipe/feature-enabled.pipe';
import { ApiService } from 'src/app/services/api/api.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-landing-footer',
  imports: [LogoComponent, RouterLink, MatIconModule, FeatureEnabledPipe],
  templateUrl: './landing-footer.component.html',
  styleUrl: './landing-footer.component.scss',
})
export class LandingFooterComponent implements OnInit {
  constructor(private api: ApiService) {}
  locale = $localize.locale;

  async onPopulate() {
    this.api.populate().subscribe();
  }

  ngOnInit(): void {
    console.log('env variables:');
    console.log(environment.melvinImprintURL);
    console.log(environment.melvinPrivacyURL);
    console.log('env end ------');
  }
}
