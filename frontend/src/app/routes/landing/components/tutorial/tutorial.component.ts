import { Component } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-tutorial',
  imports: [MatTabsModule, MatIconModule, RouterLink, MatExpansionModule],
  templateUrl: './tutorial.component.html',
  styleUrl: './tutorial.component.scss',
})
export class TutorialComponent {
  constructor(private router: Router, private route: ActivatedRoute) {}

  // ngOnInit(): void {
  //   this.router.events.subscribe(() => {
  //     const fragment = this.route.snapshot.fragment;
  //     if (fragment) {
  //       console.log(1);
  //       const element = document.getElementById(fragment);
  //       if (element) {
  //         console.log(2);

  //         element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  //       }
  //     }
  //   });
  // }
}
