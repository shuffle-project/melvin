import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject, lastValueFrom, map, takeUntil } from 'rxjs';
import { ApiService } from '../../../../services/api/api.service';
import {
  MediaCategory,
  ProjectEntity,
  VideoEntity,
} from '../../../../services/api/entities/project.entity';
import { AppState } from '../../../../store/app.state';
import * as projectsSelector from '../../../../store/selectors/projects.selector';

import { LiveAnnouncer } from '@angular/cdk/a11y';

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
import { LetDirective } from '@ngrx/component';
import { UploadProgressComponent } from 'src/app/components/upload-progress/upload-progress.component';
import { UploadHandler } from 'src/app/services/upload/upload-handler';
import { UploadService } from 'src/app/services/upload/upload.service';
import * as uuid from 'uuid';
import { UploadAreaComponent } from '../../../../components/upload-area/upload-area.component';
import { FormatDatePipe } from '../../../../pipes/format-date-pipe/format-date.pipe';
import { MediaCategoryPipe } from '../../../../pipes/media-category-pipe/media-category.pipe';
import * as editorActions from '../../../../store/actions/editor.actions';
import * as editorSelector from '../../../../store/selectors/editor.selector';

interface FileUpload {
  id: string;
  name: string;
  uploadHandler: UploadHandler;
  category: MediaCategory;
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
    MediaCategoryPipe,
    FormatDatePipe,
    MatTableModule,
    MatMenuModule,
    MatDividerModule,
    UploadProgressComponent,
    UploadAreaComponent,
  ],
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

  acceptedFileFormats = ['video/*', 'video'];
  fileFormatsLabel = 'MP4, WebM';

  @Input() projectId!: string;

  destroy$$ = new Subject<void>();

  private projects$ = this.store.select(projectsSelector.selectAllProjects);

  public project$ = this.projects$.pipe(
    map((projectEntities) =>
      projectEntities.find((project) => project.id === this.projectId)
    )
  );
  public media$ = this.store.select(editorSelector.selectMedia);

  public formGroup = new FormGroup({
    files: new FormControl<File[]>([], {
      nonNullable: true,
    }),
  });

  fileUploads: FileUpload[] = [];

  constructor(
    private fb: NonNullableFormBuilder,
    private store: Store<AppState>,
    private api: ApiService,
    private httpClient: HttpClient,
    private liveAnnouncer: LiveAnnouncer,
    private uploadService: UploadService
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

    this.formGroup.valueChanges
      .pipe(takeUntil(this.destroy$$))
      .subscribe((value) => {
        const { files } = value;

        if (files?.length === 0) return;

        files?.forEach((file: File) => {
          const uploadHandler = this.uploadService.createUpload(file);
          const id = uuid.v4();

          this.fileUploads.push({
            id,
            name: file.name,
            uploadHandler,
            category: MediaCategory.OTHER,
          });
        });

        this.formGroup.reset();
      });
  }

  ngOnDestroy(): void {
    this.destroy$$.next();
  }

  async onClickSubmit(fileUpload: FileUpload) {
    const { uploadHandler, category } = fileUpload;

    try {
      await uploadHandler.start();
      await lastValueFrom(
        this.api.createAdditionalVideo(this.projectId, {
          category,
          uploadId: uploadHandler.progress$.value.uploadId!,
          recorder: false,
        })
      );

      this.store.dispatch(
        editorActions.findProjectMedia({ projectId: this.projectId })
      );
    } catch (error) {
      console.log(error);
    }
  }

  onCategoryChange(fileUpload: FileUpload, newCategory: MediaCategory) {
    this.fileUploads.map((element) => {
      if (element.id === fileUpload.id) {
        element.category = newCategory;
      }
      return element;
    });
  }

  async onCancelUpload(fileUpload: FileUpload) {
    const handlerProgress = fileUpload.uploadHandler.progress$.value;

    try {
      if (handlerProgress.status === 'uploading') {
        fileUpload.uploadHandler.cancel$$.next();
        await lastValueFrom(this.api.cancelUpload(handlerProgress.uploadId!));
      }
    } finally {
      this.fileUploads = this.fileUploads.filter(
        (fp) => fp.id !== fileUpload.id
      );
    }
  }

  async onDeleteAdditionalMedia(
    project: ProjectEntity,
    mediaEntity: VideoEntity
  ) {
    this.store.dispatch(
      editorActions.deleteProjectMedia({
        projectId: project.id,
        mediaId: mediaEntity.id,
      })
    );
  }

  onDownloadMedia(videoEntity: VideoEntity, projectTitle: string) {
    const regexSpecialChars = /[`~!@#$%^&*()|+\=?;:'",.<>\{\}\[\]\\\/]/gi;

    const filename = `${projectTitle}_${
      videoEntity.title ? videoEntity.title : videoEntity.category
    }`;

    const readyFilename = filename
      .replace(regexSpecialChars, '')
      .replace(/ /g, '-');

    this.httpClient
      .get(videoEntity.url, { responseType: 'blob' })
      .subscribe((response) => {
        const urlCreator = window.URL || window.webkitURL;
        const imageUrl = urlCreator.createObjectURL(response);
        const tag = document.createElement('a');
        tag.href = imageUrl;
        tag.target = '_blank';
        tag.download = readyFilename + '.' + videoEntity.extension;
        document.body.appendChild(tag);
        tag.click();
        document.body.removeChild(tag);
      });
  }

  announceSortChange(sortState: any) {
    if (sortState.direction) {
      this.liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this.liveAnnouncer.announce('Sorting cleared');
    }
  }
}
