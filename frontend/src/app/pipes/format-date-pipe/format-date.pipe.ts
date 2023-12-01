import { Injectable, Pipe, PipeTransform } from '@angular/core';
import * as dayjs from 'dayjs';

@Pipe({
  name: 'formatDate',
  standalone: true,
})
@Injectable({ providedIn: 'root' })
export class FormatDatePipe implements PipeTransform {
  transform(value: number | Date | string, template?: string): unknown {
    return dayjs(value).format(template || 'DD.MM.YYYY');
  }
}
