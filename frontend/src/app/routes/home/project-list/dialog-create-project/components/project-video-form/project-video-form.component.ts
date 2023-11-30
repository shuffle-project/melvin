import { AfterViewInit, Component, Input, OnDestroy } from '@angular/core';
import { AbstractControl, FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject, take, takeUntil } from 'rxjs';
import { Language } from 'src/app/services/api/entities/config.entity';
import { AppState } from 'src/app/store/app.state';
import * as configSelector from '../../../../../../store/selectors/config.selector';
import {
  FileWithLanguage,
  MetadataGroup,
  VideoGroup,
} from '../../dialog-create-project.interfaces';
import {
  findFittingVendorLanguage,
  findVideoFileWithLanguage,
  getSelectedVendorLanguage,
} from '../../dialog-create-project.utils';
import { AlertComponent } from '../../../../../../components/alert/alert.component';
import { ProjectASRFormComponent } from '../project-asr-form/project-asr-form.component';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { LetDirective } from '@ngrx/component';
import { MatIconModule } from '@angular/material/icon';
import { NgFor, NgIf } from '@angular/common';
import { ProjectMetadataFormComponent } from '../project-metadata-form/project-metadata-form.component';

@Component({
    selector: 'app-project-video-form',
    styleUrls: ['./project-video-form.component.scss'],
    templateUrl: './project-video-form.component.html',
    standalone: true,
    imports: [
        ProjectMetadataFormComponent,
        ReactiveFormsModule,
        NgFor,
        NgIf,
        MatIconModule,
        LetDirective,
        MatFormFieldModule,
        MatSelectModule,
        MatOptionModule,
        ProjectASRFormComponent,
        AlertComponent,
    ],
})
export class ProjectVideoFormComponent implements AfterViewInit, OnDestroy {
  @Input() videoGroup!: FormGroup<VideoGroup>;
  @Input() metadataGroup!: FormGroup<MetadataGroup>;
  notIdenticalLanguages = false;

  constructor(private store: Store<AppState>) {}

  public languages$ = this.store.select(configSelector.languagesConfig);
  private asrServices$ = this.store.select(configSelector.asrServiceConfig);
  private destroy$$ = new Subject<void>();

  ngAfterViewInit() {
    const asrGroup = this.videoGroup.controls.asrGroup;

    this.videoGroup.valueChanges
      .pipe(takeUntil(this.destroy$$))
      .subscribe((videoGroupValues) => {
        const uploadedFiles =
          videoGroupValues.uploadedFiles as FileWithLanguage[];

        if (uploadedFiles) {
          const videoFile = findVideoFileWithLanguage(uploadedFiles);
          if (videoFile === undefined) return;

          const selectedVendorLanguage = getSelectedVendorLanguage(asrGroup);
          const asrGroupValid =
            asrGroup.enabled && asrGroup.value.activated && asrGroup.valid;
          const videoLanguageExist = videoFile.language !== '';
          const vendorLanguageIsDifferent =
            videoFile.language !== selectedVendorLanguage;

          if (
            asrGroupValid &&
            videoLanguageExist &&
            vendorLanguageIsDifferent
          ) {
            this.notIdenticalLanguages = true;
          } else {
            this.notIdenticalLanguages = false;
          }
        }
      });

    asrGroup.controls.asrVendor.valueChanges
      .pipe(takeUntil(this.destroy$$))
      .subscribe((vendor) => {
        if (vendor !== '') {
          const uploadedFiles = this.videoGroup.value
            .uploadedFiles as FileWithLanguage[];
          const video = findVideoFileWithLanguage(uploadedFiles);

          if (video && video.language && video.language !== '') {
            let vendorLanguages: Language[] = [];
            this.asrServices$.pipe(take(1)).subscribe((allVendors) => {
              const selectedVendor = allVendors.find(
                (o) => o.asrVendor === vendor
              );
              vendorLanguages = selectedVendor?.languages || [];
            });

            const fittingLanguage = findFittingVendorLanguage(
              vendorLanguages,
              video.language
            );

            if (fittingLanguage)
              asrGroup.controls.language.setValue(fittingLanguage);
          }
        }
      });
  }

  ngOnDestroy() {
    this.destroy$$.next();
  }

  get uploadedFiles() {
    return this.videoGroup.controls.uploadedFiles as FormArray;
  }

  getFormGroup(control: AbstractControl) {
    return control as FormGroup;
  }
}
