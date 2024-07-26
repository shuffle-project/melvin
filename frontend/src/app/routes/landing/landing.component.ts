import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LandingFooterComponent } from './components/landing-footer/landing-footer.component';
import { LandingHeaderComponent } from './components/landing-header/landing-header.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [LandingHeaderComponent, LandingFooterComponent, RouterOutlet],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent {}
