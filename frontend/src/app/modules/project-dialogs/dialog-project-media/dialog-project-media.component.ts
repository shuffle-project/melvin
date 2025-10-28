import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ProjectEntity } from 'src/app/services/api/entities/project.entity';
// import * as projectsActions from '../../../store/actions/projects.actions';
// import * as editorSelectors from '../../../store/selectors/editor.selector';
import { UploadAdditionalContentComponent } from '../components/upload-additional-content/upload-additional-content.component';

@Component({
  selector: 'app-dialog-project-media',
  imports: [
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    UploadAdditionalContentComponent,
  ],
  templateUrl: './dialog-project-media.component.html',
  styleUrl: './dialog-project-media.component.scss',
})
export class DialogProjectMediaComponent {
  project = inject<{ project: ProjectEntity }>(MAT_DIALOG_DATA).project;
}
