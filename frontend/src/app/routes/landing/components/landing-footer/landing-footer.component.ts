import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { LogoComponent } from 'src/app/components/logo/logo.component';

@Component({
  selector: 'app-landing-footer',
  standalone: true,
  imports: [LogoComponent, RouterLink, MatIconModule],
  templateUrl: './landing-footer.component.html',
  styleUrl: './landing-footer.component.scss',
})
export class LandingFooterComponent implements OnInit {
  locale = $localize.locale;

  ngOnInit() {
    console.log(this.locale);
  }
}
