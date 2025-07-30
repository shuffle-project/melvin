import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfigService } from 'src/app/services/config/config.service';

@Component({
  selector: 'app-sitemap',
  imports: [RouterLink],
  templateUrl: './sitemap.component.html',
  styleUrl: './sitemap.component.scss',
})
export class SitemapComponent implements OnInit {
  locale = $localize.locale;

  imprintUrl = this.configService.getImprintUrl();
  privacyUrl = this.configService.getPrivacyUrl();
  accessibilityStatementUrl = this.configService.getAccessibilityStatementUrl();
  disableInstallationPage = this.configService.getDisableInstallationPage();
  disableLandingPage = this.configService.getDisableLandingPage();

  constructor(private configService: ConfigService) {}

  pages = [
    { engName: 'Startpage', deName: 'Startseite', link: '/' },
    { engName: 'Imprint', deName: 'Impressum', link: this.imprintUrl },
    { engName: 'Installation', deName: 'Installation', link: '/installation' },
    {
      engName: 'Privacy',
      deName: 'Datenschutzerklärung',
      link: this.privacyUrl,
    },
    {
      engName: 'Accessibility Statement',
      deName: 'Erklärung zur Barrierefreiheit',
      link: this.accessibilityStatementUrl,
    },
    { engName: 'Tutorial', deName: 'Tutorial', link: '/tutorial' },
    { engName: 'Best Practice', deName: 'Best Practice', link: '/guide' },
    { engName: 'Sitemap', deName: 'Sitemap', link: '/sitemap' },
    { deName: 'Gebärdensprache (DGS)', link: '/sign-language' },
    { deName: 'Leichte Sprache', link: '/plain-language' },
  ];

  ngOnInit(): void {}
}
