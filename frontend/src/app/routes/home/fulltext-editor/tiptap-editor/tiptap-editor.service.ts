import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import * as transcriptionsSelectors from '../../../../store/selectors/transcriptions.selector';

@Injectable({
  providedIn: 'root',
})
export class TiptapEditorService {
  public speakerChanged$ = new Subject<void>();

  public speakers$ = this.store.select(
    transcriptionsSelectors.selectAvailableSpeakers
  );

  constructor(private store: Store) {}

  getUserColor(userId: string): string {
    return 'red';
  }
}
