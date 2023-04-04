import { Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';

@Pipe({
  name: 'timeDiff',
})
export class TimeDifferencePipe implements PipeTransform {
  transform(timeThen: string): string {
    return dayjs().to(timeThen);
  }
}
