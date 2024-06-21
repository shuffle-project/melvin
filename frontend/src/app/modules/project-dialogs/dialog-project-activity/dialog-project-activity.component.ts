import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PushPipe } from '@ngrx/component';
import { ProjectEntity } from 'src/app/services/api/entities/project.entity';
import { ProjectActivityComponent } from '../components/project-activity/project-activity.component';
import { ProjectTranscriptionComponent } from '../components/project-transcription/project-transcription.component';

@Component({
  selector: 'app-dialog-project-activity',
  standalone: true,
  imports: [
    MatDialogModule,
    PushPipe,
    MatIconModule,
    MatButtonModule,
    ProjectTranscriptionComponent,
    ProjectActivityComponent,
  ],
  templateUrl: './dialog-project-activity.component.html',
  styleUrl: './dialog-project-activity.component.scss',
})
export class DialogProjectActivityComponent {
  project = inject<{ project: ProjectEntity }>(MAT_DIALOG_DATA).project;
}
