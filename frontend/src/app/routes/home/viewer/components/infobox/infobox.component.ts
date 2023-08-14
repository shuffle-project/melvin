import { Component, Input } from '@angular/core';
import { ProjectEntity } from '../../../../../services/api/entities/project.entity';

@Component({
  selector: 'app-infobox',
  templateUrl: './infobox.component.html',
  styleUrls: ['./infobox.component.scss'],
})
export class InfoboxComponent {
  @Input({ required: true }) project!: ProjectEntity;
}
