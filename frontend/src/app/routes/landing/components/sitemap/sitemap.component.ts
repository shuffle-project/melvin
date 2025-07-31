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
  signLanguageUrl = this.configService.getSignLanguageUrl();
  easyLanguageUrl = this.configService.getEasyLanguageUrl();
  accessibilityStatementUrl = this.configService.getAccessibilityStatementUrl();
  disableInstallationPage = this.configService.getDisableInstallationPage();
  disableLandingPage = this.configService.getDisableLandingPage();

  constructor(private configService: ConfigService) {}

  activePages: { name: string; route: string }[] = [];

  pages = [
    { id: 'startpage', engName: 'Startpage', deName: 'Startseite', route: '/' },
    {
      id: 'imprint',
      engName: 'Imprint',
      deName: 'Impressum',
      route: this.imprintUrl,
    },
    {
      id: 'installation',
      engName: 'Installation',
      deName: 'Installation',
      route: '/installation',
    },
    {
      id: 'privacy',
      engName: 'Privacy',
      deName: 'Datenschutzerklärung',
      route: this.privacyUrl,
    },
    {
      id: 'accessibility-statement',
      engName: 'Accessibility Statement',
      deName: 'Erklärung zur Barrierefreiheit',
      route: this.accessibilityStatementUrl,
    },
    {
      id: 'tutorial',
      engName: 'Tutorial',
      deName: 'Tutorial',
      route: '/tutorial',
    },
    {
      id: 'best-practice',
      engName: 'Best Practice',
      deName: 'Best Practice',
      route: '/guide',
    },
    {
      id: 'sitemap',
      engName: 'Sitemap',
      deName: 'Sitemap',
      route: '/sitemap',
    },
    {
      id: 'sign-language',
      engName: 'Sign Language',
      deName: 'Gebärdensprache (DGS)',
      route: this.signLanguageUrl,
    },
    {
      id: 'easy-language',
      engName: 'Easy Language',
      deName: 'Leichte Sprache',
      route: this.easyLanguageUrl,
    },
  ];

  ngOnInit(): void {
    this.activePages = this.pages
      .filter((page) => {
        if (page.id === 'installation' && this.disableInstallationPage) {
          return false;
        }

        if (page.id === 'imprint' && !this.imprintUrl) {
          return false;
        }
        if (page.id === 'privacy' && !this.privacyUrl) {
          return false;
        }

        if (
          page.id === 'accessibility-statement' &&
          !this.accessibilityStatementUrl
        ) {
          return false;
        }
        if (page.id === 'tutorial' && this.disableLandingPage) {
          return false;
        }

        if (page.id === 'best-practice' && this.disableLandingPage) {
          return false;
        }

        if (page.id === 'sign-language' && !this.signLanguageUrl) {
          return false;
        }

        if (page.id === 'easy-language' && !this.easyLanguageUrl) {
          return false;
        }

        return true;
      })
      .map((page) => {
        return {
          name: this.locale === 'de' ? page.deName : page.engName,
          route: page.route,
        };
      })
      .sort((a, b) => {
        return a.name.localeCompare(b.name, this.locale, {
          sensitivity: 'base',
        });
      });
  }
}
