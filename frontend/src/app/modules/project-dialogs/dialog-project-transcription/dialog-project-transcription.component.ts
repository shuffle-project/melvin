import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { ProjectEntity } from 'src/app/services/api/entities/project.entity';
import { AppState } from 'src/app/store/app.state';
// import * as projectsActions from '../../../store/actions/projects.actions';
import * as editorSelectors from '../../../store/selectors/editor.selector';
import { ProjectTranscriptionComponent } from '../components/project-transcription/project-transcription.component';

@Component({
  selector: 'app-dialog-project-transcription',
  standalone: true,
  imports: [
    MatDialogModule,
    PushPipe,
    MatIconModule,
    MatButtonModule,
    ProjectTranscriptionComponent,
  ],
  templateUrl: './dialog-project-transcription.component.html',
  styleUrl: './dialog-project-transcription.component.scss',
})
export class DialogProjectTranscriptionComponent {
  public project$: Observable<ProjectEntity | null>;

  constructor(private store: Store<AppState>) {
    this.project$ = this.store.select(editorSelectors.selectProject);
  }
}
