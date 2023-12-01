import { Injectable, Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';

@Pipe({
  name: 'timeDiff',
  standalone: true,
})
@Injectable({ providedIn: 'root' })
export class TimeDifferencePipe implements PipeTransform {
  transform(timeThen: string): string {
    return dayjs().to(timeThen);
  }
}
