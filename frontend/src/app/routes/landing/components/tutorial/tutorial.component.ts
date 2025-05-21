import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { TutorialListComponent } from './tutorial-list/tutorial-list/tutorial-list.component';
import { RECORD_TUTORIAL } from './tutorial.constant';

@Component({
  selector: 'app-tutorial',
  imports: [MatTabsModule, TutorialListComponent],
  templateUrl: './tutorial.component.html',
  styleUrl: './tutorial.component.scss',
})
export class TutorialComponent {
  recordTutorial = RECORD_TUTORIAL;
}
