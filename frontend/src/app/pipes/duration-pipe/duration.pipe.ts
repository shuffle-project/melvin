import { Pipe, PipeTransform } from '@angular/core';
import * as dayjs from 'dayjs';

@Pipe({
  name: 'duration',
  standalone: true,
})
export class DurationPipe implements PipeTransform {
  transform(value: number, format = 'HH:mm:ss'): string {
    return dayjs.duration(value).format(format);
  }
}
