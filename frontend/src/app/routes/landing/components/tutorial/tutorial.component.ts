import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-tutorial',
  imports: [MatTabsModule, MatIconModule, RouterLink],
  templateUrl: './tutorial.component.html',
  styleUrl: './tutorial.component.scss',
})
export class TutorialComponent {
  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    // if (!this.route.snapshot.fragment) {
    //   const element = document.getElementById('tutorial-heading');
    //   if (element) {
    //     element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    //   }
    // }

    this.router.events.subscribe(() => {
      const fragment = this.route.snapshot.fragment;
      if (fragment) {
        const element = document.getElementById(fragment);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });
  }
}
