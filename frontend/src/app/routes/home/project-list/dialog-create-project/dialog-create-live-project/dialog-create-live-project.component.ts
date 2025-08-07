import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Store } from '@ngrx/store';
import { lastValueFrom, Subject } from 'rxjs';
import { UploadAreaComponent } from 'src/app/components/upload-area/upload-area.component';
import { UploadProgressComponent } from 'src/app/components/upload-progress/upload-progress.component';
import { MediaCategoryPipe } from 'src/app/pipes/media-category-pipe/media-category.pipe';
import { ApiService } from 'src/app/services/api/api.service';
import { AppState } from 'src/app/store/app.state';
import { LanguageAutocompleteComponent } from '../../../../../components/language-autocomplete/language-autocomplete/language-autocomplete.component';

@Component({
  selector: 'app-dialog-create-live-project',
  imports: [
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatTableModule,
    MatSelectModule,
    MatCheckboxModule,
    MediaCategoryPipe,
    MatProgressBarModule,
    UploadProgressComponent,
    UploadAreaComponent,
    LanguageAutocompleteComponent,
  ],
  templateUrl: './dialog-create-live-project.component.html',
  styleUrl: './dialog-create-live-project.component.scss',
})
export class DialogCreateLiveProjectComponent {
  loading = false;

  private destroy$$ = new Subject<void>();

  constructor(
    private api: ApiService,
    private store: Store<AppState>,
    private dialogRef: MatDialogRef<DialogCreateLiveProjectComponent>
  ) {}

  async onCancelUpload() {}

  async onSubmitForm() {
    await lastValueFrom(
      this.api.createLiveProject({ title: 'liveproejct', language: 'de' })
    );
  }
}
