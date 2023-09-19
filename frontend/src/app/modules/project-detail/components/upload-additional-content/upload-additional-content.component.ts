import { HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { firstValueFrom, map, tap } from 'rxjs';
import { ApiService } from '../../../../services/api/api.service';
import {
  AdditionalMedia,
  ProjectEntity,
  VideoCategory,
  VideoEntity,
} from '../../../../services/api/entities/project.entity';
import { AppState } from '../../../../store/app.state';
import * as projectsSelector from '../../../../store/selectors/projects.selector';

@Component({
  selector: 'app-upload-additional-content',
  templateUrl: './upload-additional-content.component.html',
  styleUrls: ['./upload-additional-content.component.scss'],
})
export class UploadAdditionalContentComponent implements OnInit {
  VideoCategory = VideoCategory;
  @Input() projectId!: string;

  private projects$ = this.store.select(projectsSelector.selectAllProjects);

  public project$ = this.projects$.pipe(
    tap((projectEntities) => console.log(projectEntities)),
    map((projectEntities) =>
      projectEntities.find((project) => project.id === this.projectId)
    )
  );

  public formGroup!: FormGroup<{
    title: FormControl<string>;
    file: FormControl<File | null>;
    category: FormControl<VideoCategory | null>;
  }>;
  private currentFile: any;

  constructor(
    private fb: NonNullableFormBuilder,
    private store: Store<AppState>,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      title: this.fb.control<string>('', [Validators.required]),
      file: this.fb.control<File | null>(null, [Validators.required]),
      category: this.fb.control<VideoCategory | null>(null, [
        Validators.required,
      ]),
    });
  }

  onFileChange(event: any) {
    this.currentFile = event.target.files[0];
  }

  async onClickSubmit() {
    if (this.formGroup.valid) {
      this.api
        .uploadVideo(
          this.projectId,
          {
            title: this.formGroup.value.title!,
            category: this.formGroup.value.category!,
          },
          this.currentFile
        )
        .subscribe({
          next: (event: HttpEvent<ProjectEntity>) => console.log(event),
          error: (error: HttpErrorResponse) => console.log(error),
        });
    }
  }

  async onDeleteAdditionalMedia(
    project: ProjectEntity,
    additional: AdditionalMedia | VideoEntity
  ) {
    // TODO move to effect and delete obj in reducer
    await firstValueFrom(this.api.deleteMedia(project.id, additional.id));
  }
}
