import { Component, Input } from '@angular/core';
import { ProjectEntity } from '../../../../../services/api/entities/project.entity';

@Component({
  selector: 'app-view-selection',
  templateUrl: './view-selection.component.html',
  styleUrls: ['./view-selection.component.scss'],
})
export class ViewSelectionComponent {
  @Input({ required: true }) project!: ProjectEntity | null;
}
