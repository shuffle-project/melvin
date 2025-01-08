import {
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
} from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject, Subscription, combineLatest, map, takeUntil } from 'rxjs';
import { ApiService } from '../../../../services/api/api.service';
import {
  MediaCategory,
  MediaEntity,
  ProjectEntity,
  VideoEntity,
} from '../../../../services/api/entities/project.entity';
import { AppState } from '../../../../store/app.state';
import * as projectsSelector from '../../../../store/selectors/projects.selector';

import { LiveAnnouncer } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { LetDirective, PushPipe } from '@ngrx/component';
import * as uuid from 'uuid';
import { FormatDatePipe } from '../../../../pipes/format-date-pipe/format-date.pipe';
import { MediaCategoryPipe } from '../../../../pipes/media-category-pipe/media-category.pipe';
import * as editorActions from '../../../../store/actions/editor.actions';
import { selectUserId } from '../../../../store/selectors/auth.selector';
import * as editorSelector from '../../../../store/selectors/editor.selector';

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
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatOptionModule,
        MatButtonModule,
        MatIconModule,
        MatProgressBarModule,
        LetDirective,
        PushPipe,
        MediaCategoryPipe,
        FormatDatePipe,
        CommonModule,
        MatTableModule,
        MatMenuModule,
        MatDividerModule,
    ]
})
export class UploadAdditionalContentComponent implements OnInit {
  dataSource = new MatTableDataSource();
  displayedColumns: string[] = ['category', 'title', 'createdAt', 'more'];

  public selectableMediaCategories = [
    MediaCategory.OTHER,
    MediaCategory.SIGN_LANGUAGE,
    MediaCategory.SLIDES,
    MediaCategory.SPEAKER,
  ];
  @Input() projectId!: string;

  destroy$$ = new Subject<void>();

  private projects$ = this.store.select(projectsSelector.selectAllProjects);

  public project$ = this.projects$.pipe(
    map((projectEntities) =>
      projectEntities.find((project) => project.id === this.projectId)
    )
  );
  public media$ = this.store.select(editorSelector.selectMedia);

  public isOwner$ = combineLatest([
    this.store.select(selectUserId),
    this.project$,
  ]).pipe(map(([userId, project]) => userId === project?.createdBy.id));

  public formGroup!: FormGroup<{
    file: FormControl<File | null>;
    category: FormControl<MediaCategory | null>;
  }>;
  private selectedFile: any;

  fileUploads: FileUpload[] = [];

  constructor(
    private fb: NonNullableFormBuilder,
    private store: Store<AppState>,
    private api: ApiService,
    private httpClient: HttpClient,
    private liveAnnouncer: LiveAnnouncer
  ) {
    this.media$.pipe(takeUntil(this.destroy$$)).subscribe((media) => {
      if (media) {
        const mediaArray = [...media.videos];
        this.dataSource.data = mediaArray;
      }
    });
  }

  ngOnInit(): void {
    this.store.dispatch(
      editorActions.findProjectMedia({ projectId: this.projectId })
    );

    this.formGroup = this.fb.group({
      file: this.fb.control<File | null>(null, [Validators.required]),
      category: this.fb.control<MediaCategory | null>(null, [
        Validators.required,
      ]),
    });
  }

  ngOnDestroy(): void {
    this.destroy$$.next();
  }

  onFileChange(event: any) {
    this.selectedFile = event.target.files[0];
  }

  async onClickSubmit() {
    if (!this.formGroup.valid) {
      this.formGroup.markAllAsTouched();
    } else {
      const id = uuid.v4();
      this.fileUploads.push({
        id,
        // TODO title?
        name: '',
        totalSize: this.selectedFile.size,
        sub: this.api
          .uploadVideo(
            this.projectId,
            {
              // TODO title?
              title: '',
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

        this.store.dispatch(
          editorActions.findProjectMedia({ projectId: this.projectId })
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
    mediaEntity: MediaEntity
  ) {
    this.store.dispatch(
      editorActions.deleteProjectMedia({
        projectId: project.id,
        mediaId: mediaEntity.id,
      })
    );
  }

  onDownloadMedia(project: ProjectEntity, videoEntity: VideoEntity) {
    // console.log(project, mediaEntity);

    const resolution = videoEntity.resolutions.sort((a, b) => {
      return a.width - b.width;
    })[0];

    this.httpClient
      .get(resolution.url, { responseType: 'blob' })
      .subscribe((response) => {
        const urlCreator = window.URL || window.webkitURL;
        const imageUrl = urlCreator.createObjectURL(response);
        const tag = document.createElement('a');
        tag.href = imageUrl;
        tag.target = '_blank';
        tag.download = videoEntity.title + '.' + videoEntity.extension;
        document.body.appendChild(tag);
        tag.click();
        document.body.removeChild(tag);
      });

    // window.URL.revokeObjectURL(objectURL);
  }

  announceSortChange(sortState: any) {
    if (sortState.direction) {
      this.liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this.liveAnnouncer.announce('Sorting cleared');
    }
  }
}
