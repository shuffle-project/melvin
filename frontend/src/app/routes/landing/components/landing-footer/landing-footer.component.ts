import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { LogoComponent } from 'src/app/components/logo/logo.component';
import { FeatureEnabledPipe } from 'src/app/pipes/feature-enabled-pipe/feature-enabled.pipe';
import { ApiService } from 'src/app/services/api/api.service';
import { ConfigService } from 'src/app/services/config/config.service';

@Component({
  selector: 'app-landing-footer',
  imports: [LogoComponent, RouterLink, MatIconModule, FeatureEnabledPipe],
  templateUrl: './landing-footer.component.html',
  styleUrl: './landing-footer.component.scss',
})
export class LandingFooterComponent {
  locale = $localize.locale;
  footerConfigMap!: Map<string, string>;

  emptyString = '';

  imprintUrl = this.configService.getImprintUrl();
  privacyUrl = this.configService.getPrivacyUrl();
  accessibilityStatementUrl = this.configService.getAccessibilityStatementUrl();

  constructor(private api: ApiService, private configService: ConfigService) {}

  async onPopulate() {
    this.api.populate().subscribe();
  }
}
