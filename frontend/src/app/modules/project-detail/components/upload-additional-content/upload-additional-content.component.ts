import {
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
} from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subscription, combineLatest, firstValueFrom, map } from 'rxjs';
import { ApiService } from '../../../../services/api/api.service';
import {
  AdditionalMedia,
  MediaCategory,
  ProjectEntity,
  VideoEntity,
} from '../../../../services/api/entities/project.entity';
import { AppState } from '../../../../store/app.state';
import * as projectsSelector from '../../../../store/selectors/projects.selector';

import * as uuid from 'uuid';
import { selectUserId } from '../../../../store/selectors/auth.selector';

interface FileUpload {
  id: string;
  name: string;
  sub: Subscription;
  loaded?: number;
  totalSize?: number;
}

@Component({
  selector: 'app-upload-additional-content',
  templateUrl: './upload-additional-content.component.html',
  styleUrls: ['./upload-additional-content.component.scss'],
})
export class UploadAdditionalContentComponent implements OnInit {
  public selectableMediaCategories = [
    MediaCategory.OTHER,
    MediaCategory.SIGN_LANGUAGE,
    MediaCategory.SLIDES,
    MediaCategory.SPEAKER,
  ];
  @Input() projectId!: string;

  private projects$ = this.store.select(projectsSelector.selectAllProjects);

  public project$ = this.projects$.pipe(
    map((projectEntities) =>
      projectEntities.find((project) => project.id === this.projectId)
    )
  );

  public isOwner$ = combineLatest([
    this.store.select(selectUserId),
    this.project$,
  ]).pipe(map(([userId, project]) => userId === project?.createdBy));

  public formGroup!: FormGroup<{
    title: FormControl<string>;
    file: FormControl<File | null>;
    category: FormControl<MediaCategory | null>;
  }>;
  private selectedFile: any;

  fileUploads: FileUpload[] = [];

  constructor(
    private fb: NonNullableFormBuilder,
    private store: Store<AppState>,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      title: this.fb.control<string>('', [Validators.required]),
      file: this.fb.control<File | null>(null, [Validators.required]),
      category: this.fb.control<MediaCategory | null>(null, [
        Validators.required,
      ]),
    });
  }

  onFileChange(event: any) {
    this.selectedFile = event.target.files[0];
  }

  async onClickSubmit() {
    if (this.formGroup.valid) {
      const id = uuid.v4();
      this.fileUploads.push({
        id,
        name: this.formGroup.value.title!,
        totalSize: this.selectedFile.size,
        sub: this.api
          .uploadVideo(
            this.projectId,
            {
              title: this.formGroup.value.title!,
              category: this.formGroup.value.category!,
            },
            this.selectedFile
          )
          .subscribe({
            next: (event: HttpEvent<ProjectEntity>) =>
              this._handleHttpEvent(id, event),
            error: (error: HttpErrorResponse) =>
              this._handleHttpError(id, error),
          }),
      });
      this.formGroup.reset();
    }
  }

  onCancelUpload(fileUpload: FileUpload) {
    fileUpload.sub.unsubscribe();

    this.fileUploads.splice(
      this.fileUploads.findIndex((element) => element.id === fileUpload.id),
      1
    );

    // this.uploadSubscriptions.indexOf(element => element.)
  }

  private _handleHttpEvent(id: string, event: HttpEvent<ProjectEntity>): void {
    const fileUpload = this.fileUploads.find((element) => element.id === id);

    switch (event.type) {
      case HttpEventType.UploadProgress:
        if (fileUpload) {
          fileUpload.loaded = event.loaded;
        }
        // this.fileUploadProgress = (event.loaded / this.totalFileSize) * 100;
        break;
      case HttpEventType.Response:
        // TODO maybe call store method?? -> user will get the ws eveent anyways
        this.fileUploads.splice(
          this.fileUploads.findIndex((element) => element.id === id),
          1
        );

        break;
      default:
        break;
    }
  }

  private _handleHttpError(id: string, error: HttpErrorResponse): void {
    this.fileUploads.splice(
      this.fileUploads.findIndex((element) => element.id === id),
      1
    );
  }

  async onDeleteAdditionalMedia(
    project: ProjectEntity,
    additional: AdditionalMedia | VideoEntity
  ) {
    // TODO move to effect and delete obj in reducer
    await firstValueFrom(this.api.deleteMedia(project.id, additional.id));
  }
}
