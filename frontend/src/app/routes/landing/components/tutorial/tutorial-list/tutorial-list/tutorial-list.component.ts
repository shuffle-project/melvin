import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TutorialStep } from '../../tutorial.constant';

@Component({
  selector: 'app-tutorial-list',
  imports: [MatIconModule],
  templateUrl: './tutorial-list.component.html',
  styleUrl: './tutorial-list.component.scss',
})
export class TutorialListComponent {
  @Input() tutorialList: TutorialStep[] = [];

  locale = $localize.locale;

  ngOnInit() {
    console.log(this.tutorialList);
  }
}
