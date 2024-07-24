import { AfterViewInit, Component, Input, OnDestroy } from '@angular/core';
import {
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subject, takeUntil } from 'rxjs';
import { UploadFilesComponent } from '../../../../../../components/upload-files/upload-files.component';
import {
  LiveGroup,
  MetadataGroup,
  VideoGroup,
} from '../../dialog-create-project.interfaces';
import {
  findSubtitleFiles,
  findVideoFile,
  nameWithoutExtension,
} from '../../dialog-create-project.utils';

import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatRadioModule } from '@angular/material/radio';

@Component({
  selector: 'app-project-source-form',
  styleUrls: ['./project-source-form.component.scss'],
  templateUrl: './project-source-form.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatRadioModule,
    UploadFilesComponent,
    MatFormFieldModule,
    MatInputModule,
    MatButtonToggleModule,
  ],
})
export class ProjectSourceFormComponent implements AfterViewInit, OnDestroy {
  @Input() metadataGroup!: FormGroup<MetadataGroup>;
  @Input() videoGroup!: FormGroup<VideoGroup>;
  @Input() liveGroup!: FormGroup<LiveGroup>;
  @Input() acceptedFileFormats!: string[];

  private destroy$$ = new Subject<void>();

  constructor(private fb: NonNullableFormBuilder) {}

  ngAfterViewInit() {
    this.videoGroup.controls.files.valueChanges
      .pipe(takeUntil(this.destroy$$))
      .subscribe((value) => {
        if (this.videoGroup.controls.files.valid && !this.videoGroup.disabled) {
          const video = findVideoFile(value);

          if (video && this.metadataGroup.value.title === '') {
            this.metadataGroup.controls.title.setValue(
              nameWithoutExtension(video)
            );
          }

          const subtitleFiles = findSubtitleFiles(value);
          const asrGroup = this.videoGroup.controls.asrGroup;

          if (subtitleFiles.length > 0) {
            asrGroup.controls.activated.setValue(false);
            asrGroup.controls.activated.disable();
          } else {
            asrGroup.controls.activated.enable();
          }

          const uploadedFiles = this.videoGroup.controls.uploadedFiles;
          uploadedFiles.clear();

          value.forEach((file: File) => {
            const uploadedFileEntry = this.fb.group({
              content: this.fb.control<File>(file),
              language: this.fb.control<string>(''),
            });
            uploadedFiles.push(uploadedFileEntry);
          });
        }
      });
  }

  ngOnDestroy() {
    this.destroy$$.next();
  }
}
