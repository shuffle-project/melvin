import { Component } from '@angular/core';
import { LandingComponent } from '../../landing.component';
import { LandingBackLinkComponent } from '../landing-back-link/landing-back-link.component';

@Component({
  selector: 'app-accessibility-statement',
  imports: [LandingBackLinkComponent, LandingComponent],
  templateUrl: './accessibility-statement.component.html',
  styleUrl: './accessibility-statement.component.scss',
})
export class AccessibilityStatementComponent {}
