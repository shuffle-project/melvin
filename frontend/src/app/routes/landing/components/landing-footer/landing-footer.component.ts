import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { LogoComponent } from 'src/app/components/logo/logo.component';
import { ApiService } from 'src/app/services/api/api.service';
import { ConfigService } from 'src/app/services/config/config.service';

@Component({
  selector: 'app-landing-footer',
  imports: [LogoComponent, RouterLink, MatIconModule],
  templateUrl: './landing-footer.component.html',
  styleUrl: './landing-footer.component.scss',
})
export class LandingFooterComponent {
  locale = $localize.locale;
  footerConfigMap!: Map<string, string>;

  emptyString = '';

  imprintUrl = this.configService.getImprintUrl();
  privacyUrl = this.configService.getPrivacyUrl();
  signLanguageUrl = this.configService.getSignLanguageUrl();
  easyLanguageUrl = this.configService.getEasyLanguageUrl();
  accessibilityStatementUrl = this.configService.getAccessibilityStatementUrl();
  disableInstallationPage = this.configService.getDisableInstallationPage();
  disableLandingPage = this.configService.getDisableLandingPage();
  contactEmail = this.configService.getContactEmail();

  constructor(private api: ApiService, private configService: ConfigService) {}

  async onPopulate() {
    this.api.populate().subscribe();
  }
}
