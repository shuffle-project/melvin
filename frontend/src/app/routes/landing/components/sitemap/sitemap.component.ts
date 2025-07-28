import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FeatureEnabledPipe } from 'src/app/pipes/feature-enabled-pipe/feature-enabled.pipe';
import { ConfigService } from 'src/app/services/config/config.service';

@Component({
  selector: 'app-sitemap',
  imports: [RouterLink, FeatureEnabledPipe],
  templateUrl: './sitemap.component.html',
  styleUrl: './sitemap.component.scss',
})
export class SitemapComponent {
  locale = $localize.locale;

  imprintUrl = this.configService.getImprintUrl();
  privacyUrl = this.configService.getPrivacyUrl();
  accessibilityStatementUrl = this.configService.getAccessibilityStatementUrl();

  constructor(private configService: ConfigService) {}
}
