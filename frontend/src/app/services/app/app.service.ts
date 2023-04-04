import { Injectable } from '@angular/core';
import { fromEvent, merge, take } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  public hasUserInteractedWithDOM = false;

  constructor() {}

  init() {
    merge(fromEvent(window, 'click'), fromEvent(window, 'scroll'))
      .pipe(take(1))
      .subscribe(() => (this.hasUserInteractedWithDOM = true));
  }
}
