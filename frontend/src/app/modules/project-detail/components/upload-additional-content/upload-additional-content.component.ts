import { HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { ApiService } from '../../../../services/api/api.service';
import { ProjectEntity } from '../../../../services/api/entities/project.entity';

@Component({
  selector: 'app-upload-additional-content',
  templateUrl: './upload-additional-content.component.html',
  styleUrls: ['./upload-additional-content.component.scss'],
})
export class UploadAdditionalContentComponent implements OnInit {
  @Input() projectId!: string;

  public formGroup!: FormGroup<{ file: FormControl<File | null> }>;
  private currentFile: any;

  constructor(private fb: NonNullableFormBuilder, private api: ApiService) {}

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      file: this.fb.control<File | null>(null, [Validators.required]),
    });
  }

  onFileChange(event: any) {
    this.currentFile = event.target.files[0];
  }

  async onClickSubmit() {
    if (this.formGroup.valid) {
      this.api.uploadVideo(this.projectId, this.currentFile).subscribe({
        next: (event: HttpEvent<ProjectEntity>) => console.log(event),
        error: (error: HttpErrorResponse) => console.log(error),
      });
    }
  }
}
