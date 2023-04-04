import { Pipe, PipeTransform } from '@angular/core';
import * as dayjs from 'dayjs';

@Pipe({
  name: 'duration',
})
export class DurationPipe implements PipeTransform {
  transform(value: number): string {
    return dayjs.duration(value).format('HH:mm:ss');
  }
}
