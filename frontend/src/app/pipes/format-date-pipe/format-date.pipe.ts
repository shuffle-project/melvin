import { Pipe, PipeTransform } from '@angular/core';
import * as dayjs from 'dayjs';

@Pipe({
  name: 'formatDate',
  standalone: true,
})
export class FormatDatePipe implements PipeTransform {
  transform(value: number | Date | string, template?: string): unknown {
    return dayjs(value).format(template || 'DD.MM.YYYY');
  }
}
