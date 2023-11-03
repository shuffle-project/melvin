import {
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
} from '@angular/common/http';
import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { ApiService } from 'src/app/services/api/api.service';
import { AsrVendors } from 'src/app/services/api/dto/create-transcription.dto';
import { ProjectEntity } from 'src/app/services/api/entities/project.entity';
import { CreateProjectService } from 'src/app/services/create-project/create-project.service';
import {
  MemberEntry,
  MemberEntryType,
} from '../../../../../app/constants/member.constants';
import { ProjectGroup } from './dialog-create-project.interfaces';

@Component({
  selector: 'app-dialog-create-project',
  styleUrls: ['./dialog-create-project.component.scss'],
  templateUrl: './dialog-create-project.component.html',
})
export class DialogCreateProjectComponent implements AfterViewInit, OnDestroy {
  loading = false;
  fileUploadProgress = 0; // value from 0 to 100
  uploadSubscription!: Subscription;
  private totalFileSize = 0;
  error: HttpErrorResponse | null = null;
  acceptedFileFormats: string[] = ['audio', 'video', '.srt', '.vtt'];

  private destroy$$ = new Subject<void>();

  @ViewChild('stepper') stepper!: MatStepper;

  public formGroup = this.fb.group<ProjectGroup>(
    {
      metadataGroup: this.fb.group({
        sourceMode: this.fb.control<'video' | 'live'>('video'),
        title: this.fb.control<string>('', {
          validators: [Validators.required],
        }),
        members: this.fb.control<MemberEntry[]>([], {
          validators: [this.memberEntriesValidator()],
        }),
      }),
      videoGroup: this.fb.group({
        files: this.fb.control<File[]>([], {
          validators: [this.fileContentValidator()],
        }),
        uploadedFiles: this.fb.array<
          FormGroup<{
            content: FormControl<File>;
            language: FormControl<string>;
          }>
        >([], {
          validators: [this.fileLanguageValidator()],
        }),
        asrGroup: this.fb.group(
          {
            activated: this.fb.control<Boolean>(false),
            asrVendor: this.fb.control<AsrVendors | ''>(
              {
                value: '',
                disabled: true,
              },
              { validators: [this.asrVendorValidator()] }
            ),
            language: this.fb.control<string>({ value: '', disabled: true }),
          },
          {
            validators: [this.asrGroupValidator()],
          }
        ),
      }),
      liveGroup: this.fb.group({
        url: this.fb.control<string>('', {
          validators: [
            Validators.required,
            Validators.pattern(
              '(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?'
            ),
          ],
        }),
        settings: this.fb.group({
          language: this.fb.control<string>('', {
            validators: [Validators.required],
          }),
        }),
        asrGroup: this.fb.group(
          {
            activated: this.fb.control<Boolean>(false),
            asrVendor: this.fb.control<AsrVendors | ''>(
              {
                value: '',
                disabled: true,
              },
              { validators: [this.asrVendorValidator()] }
            ),
            language: this.fb.control<string>({ value: '', disabled: true }),
          },
          {
            validators: [this.asrGroupValidator()],
          }
        ),
      }),
    },
    {
      validators: [
        this.mediaSourceValidator(),
        this.videoStepValidator(),
        this.liveStepValidator(),
      ],
    }
  );

  constructor(
    private dialogRef: MatDialogRef<any>,
    private fb: NonNullableFormBuilder,
    private api: ApiService,
    private createProjectService: CreateProjectService
  ) {}

  ngAfterViewInit() {
    this.stepper._getIndicatorType = () => 'number';

    this.formGroup.controls.videoGroup.controls.files.valueChanges
      .pipe(takeUntil(this.destroy$$))
      .subscribe((value) => {
        const totalFileSize = value
          .map((v) => v.size)
          .reduce((total, current) => total + current);
        this.totalFileSize = totalFileSize;
      });
  }

  ngOnDestroy() {
    this.destroy$$.next();
  }

  mediaSourceValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const c = control as FormGroup<ProjectGroup>;

      if (
        c.controls.metadataGroup.controls.sourceMode.value === 'video' &&
        c.controls.videoGroup.controls.files.valid
      ) {
        return null;
      } else if (
        c.controls.metadataGroup.controls.sourceMode.value === 'live' &&
        c.controls.liveGroup.controls.url.valid
      ) {
        return null;
      } else {
        return { mediaSourceStepInvalid: true };
      }
    };
  }

  asrGroupValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const { activated, language, asrVendor } = control.getRawValue();
      if (activated) {
        return language !== '' && asrVendor !== ''
          ? null
          : { asrGroupInvalid: true };
      }
      return null;
    };
  }

  asrVendorValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      return control.getRawValue() === '' ? { asrVendorRequired: true } : null;
    };
  }

  liveStepValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const c = control as FormGroup<ProjectGroup>;
      const titleValid = c.controls.metadataGroup.controls.title.valid;
      const asrValid = c.controls.liveGroup.controls.asrGroup.valid;
      const settingsValid = c.controls.liveGroup.controls.settings.valid;

      return titleValid && asrValid && settingsValid
        ? null
        : { liveStepInvalid: true };
    };
  }

  videoStepValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const c = control as FormGroup<ProjectGroup>;
      const titleValid = c.controls.metadataGroup.controls.title.valid;
      const fileLanguagesValid =
        c.controls.videoGroup.controls.uploadedFiles.valid;
      const asrValid = c.controls.videoGroup.controls.asrGroup.valid;

      if (c.controls.videoGroup.controls.asrGroup.disabled) {
        return titleValid && fileLanguagesValid
          ? null
          : { videoStepInvalid: true };
      } else {
        return titleValid && fileLanguagesValid && asrValid
          ? null
          : { videoStepInvalid: true };
      }
    };
  }

  fileContentValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const videoFiles = control.value.filter(
        (file: File) =>
          file.type.includes('audio') || file.type.includes('video')
      );

      if (videoFiles.length > 1) return { tooManyVideos: true };
      if (videoFiles.length < 1) return { videoRequired: true };
      return null;
    };
  }

  fileLanguageValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const files: { content: File; language: string }[] = control.value;
      const fileWithoutLanugageExists = files.some(
        (file) => file.language === ''
      );
      return fileWithoutLanugageExists
        ? { fileWithoutLanugageExists: true }
        : null;
    };
  }

  memberEntriesValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const invalidEntryExist =
        control.value.filter(
          (member: MemberEntry) => member.type === MemberEntryType.INVALID_EMAIL
        ).length > 0;

      return invalidEntryExist ? { invalidEntry: true } : null;
    };
  }

  onCreateProject() {
    this.loading = true;
    const formData = this.createProjectService.create(this.formGroup);

    this.uploadSubscription = this.api.createProject(formData).subscribe({
      next: (event: HttpEvent<ProjectEntity>) => this._handleHttpEvent(event),
      error: (error: HttpErrorResponse) => this._handleErrorHttpEvent(error),
    });
  }

  cancelUpload() {
    if (this.uploadSubscription) {
      this.uploadSubscription.unsubscribe();
      this.loading = false;
      this.dialogRef.close();
    }
  }

  get contentTitle(): string | null {
    const title = this.formGroup.controls.videoGroup.controls.files.value.find(
      (file) => file.type.includes('audio') || file.type.includes('video')
    );
    return title ? title.name : null;
  }

  get subtitleFiles(): File[] {
    return this.formGroup.controls.videoGroup.controls.files.value.filter(
      (file) => file.name.endsWith('.srt') || file.name.endsWith('.vtt')
    );
  }

  // mediaFile: File,
  // subtitleFiles: File[]
  private _handleHttpEvent(event: HttpEvent<ProjectEntity>) {
    switch (event.type) {
      case HttpEventType.UploadProgress:
        this.fileUploadProgress = (event.loaded / this.totalFileSize) * 100;
        break;
      case HttpEventType.Response:
        // TODO maybe call store method?? -> user will get the ws eveent anyways
        this.loading = false;
        this.dialogRef.close();
        break;
      default:
        break;
    }
  }

  private _handleErrorHttpEvent(error: HttpErrorResponse) {
    this.loading = false;
    this.formGroup.enable();

    this.error = error;
    console.log('error in project creation', error);
  }
}
