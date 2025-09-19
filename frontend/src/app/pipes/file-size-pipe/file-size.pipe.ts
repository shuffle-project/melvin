import { Pipe, PipeTransform } from '@angular/core';

const ONE_KB = 1000;
const ONE_MB = 1000 * 1000;
const ONE_GB = ONE_MB * 1000;

@Pipe({
  name: 'fileSize',
})
export class FileSizePipe implements PipeTransform {
  transform(value: number): string {
    if (value >= ONE_GB) {
      return `${(value / ONE_GB).toFixed(1)} GB`;
    } else if (value >= ONE_MB) {
      return `${(value / ONE_MB).toFixed(0)} MB`;
    } else {
      return `${(value / ONE_KB).toFixed(0)} KB`;
    }
  }
}
