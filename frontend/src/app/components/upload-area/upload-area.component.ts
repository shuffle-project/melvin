import { Component, Input } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-upload-area',
  templateUrl: './upload-area.component.html',
  styleUrls: ['./upload-area.component.scss'],
  imports: [MatIconModule, MatButtonModule, MatTooltipModule],
})
export class UploadAreaComponent implements ControlValueAccessor {
  @Input() acceptedFileFormats!: string[];
  @Input() fileFormatsLabel!: string;
  @Input() acceptMultipleFiles = true;

  files: File[] = [];
  touched = false;
  disabled = false;

  constructor(private control: NgControl) {
    this.control.valueAccessor = this;
  }

  public get invalid() {
    return this.control ? this.control.invalid : false;
  }

  public get showError() {
    if (!this.control) {
      return false;
    }

    const { dirty, touched } = this.control;
    return this.invalid ? dirty || touched : false;
  }

  onChange = (files: File[]) => {};
  onTouched = () => {};

  writeValue(files: File[]): void {
    this.files = files;
  }

  registerOnChange(onChange: any): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: any): void {
    this.onTouched = onTouched;
  }

  setDisabledState?(disabled: boolean): void {
    this.disabled = disabled;
  }

  markAsTouched() {
    if (!this.touched) {
      this.onTouched();
      this.touched = true;
    }
  }

  onAddFiles(event: any) {
    this.markAsTouched();

    if (!this.disabled) {
      let addedFiles = [...event.target.files];

      const onlyValidFiles = addedFiles.filter((file: File) => {
        return this.acceptedFileFormats.find((acceptedFormat) => {
          if (acceptedFormat.includes('.')) {
            return file.name.endsWith(acceptedFormat);
          } else {
            return file.type.includes(acceptedFormat);
          }
        });
      });

      this.files = [...this.files, ...onlyValidFiles];
      this.onChange(this.files);
    }
  }

  onRemoveFile(file: File) {
    this.markAsTouched();
    if (!this.disabled) {
      const indexOfFile = this.files.findIndex(
        (o: File) => o.name === file.name
      );

      this.files.splice(indexOfFile, 1);
      this.onChange(this.files);
    }
  }
}
