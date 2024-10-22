import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FeatureEnabledPipe } from 'src/app/pipes/feature-enabled-pipe/feature-enabled.pipe';

@Component({
  selector: 'app-sitemap',
  standalone: true,
  imports: [RouterLink, FeatureEnabledPipe],
  templateUrl: './sitemap.component.html',
  styleUrl: './sitemap.component.scss',
})
export class SitemapComponent {
  locale = $localize.locale;
}
