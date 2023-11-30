import { Component, Input } from '@angular/core';
import { ProjectEntity } from '../../../../../services/api/entities/project.entity';
import { ProjectStatusPipe } from '../../../../../pipes/project-status-pipe/project-status.pipe';
import { LanguageCodePipe } from '../../../../../pipes/language-code-pipe/language-code.pipe';
import { DatePipe } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
    selector: 'app-infobox',
    templateUrl: './infobox.component.html',
    styleUrls: ['./infobox.component.scss'],
    standalone: true,
    imports: [
    MatExpansionModule,
    DatePipe,
    LanguageCodePipe,
    ProjectStatusPipe
],
})
export class InfoboxComponent {
  @Input({ required: true }) project!: ProjectEntity;
}
