import { Routes } from '@angular/router';
import { DisabledLandingGuard } from 'src/app/guards/disabled-landing.guard';
import { FooterGuard } from 'src/app/guards/footer.guard';
import { AccessibilityStatementComponent } from './components/accessibility-statement/accessibility-statement.component';
import { GuideComponent } from './components/guide/guide.component';
import { ImprintComponent } from './components/imprint/imprint.component';
import { InstallationComponent } from './components/installation/installation.component';
import { LandingMainComponent } from './components/landing-main/landing-main.component';
import { PlainLanguageComponent } from './components/plain-language/plain-language.component';
import { PrivacyComponent } from './components/privacy/privacy.component';
import { SignLanguageComponent } from './components/sign-language/sign-language.component';
import { SitemapComponent } from './components/sitemap/sitemap.component';
import { TutorialComponent } from './components/tutorial/tutorial.component';
import { LandingComponent } from './landing.component';

export const LandingRoutes: Routes = [
  {
    path: '',
    component: LandingComponent,
    children: [
      {
        path: '',
        component: LandingMainComponent,
        canActivate: [DisabledLandingGuard],
        title: $localize`:@@startPageTitle:Melvin`,
      },
      {
        path: 'privacy',
        canActivate: [FooterGuard],
        component: PrivacyComponent,
        title: $localize`:@@privacyPageTitle:Privacy - Melvin`,
      },
      {
        path: 'imprint',
        canActivate: [FooterGuard],
        component: ImprintComponent,
        title: $localize`:@@imprintPageTitle:Imprint - Melvin`,
      },
      {
        path: 'plain-language',
        canActivate: [DisabledLandingGuard],
        component: PlainLanguageComponent,
        title: 'Leichte Sprache - Melvin',
      },
      {
        path: 'sign-language',
        canActivate: [DisabledLandingGuard],
        component: SignLanguageComponent,
        title: 'Gebärdensprache (DGS) - Melvin',
      },
      {
        path: 'sitemap',
        component: SitemapComponent,
        title: 'Sitemap - Melvin',
      },
      {
        path: 'accessibility-statement',
        canActivate: [FooterGuard],
        component: AccessibilityStatementComponent,
        title: $localize`:@@accessibilityStatementPageTitle:Accessibility Statement - Melvin`,
      },
      {
        path: 'tutorial',
        canActivate: [DisabledLandingGuard],
        component: TutorialComponent,
        title: $localize`:@@tutorialPageTitle:Tutorial - Melvin`,
      },
      {
        path: 'installation',
        canActivate: [FooterGuard],
        component: InstallationComponent,
        title: $localize`:@@installationPageTitle:Installation - Melvin`,
      },
      {
        path: 'guide',
        canActivate: [DisabledLandingGuard],
        component: GuideComponent,
        title: $localize`:@@GuidePageTitle:Best Practice - Melvin`,
      },
      //   {
      //     path: '**',
      //     redirectTo: '',
      //   },
    ],
  },
];
