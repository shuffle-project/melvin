import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, firstValueFrom, Subject, tap } from 'rxjs';
import * as transcriptionsSelectors from '../../../../store/selectors/transcriptions.selector';
import { SpeakerEntity } from 'src/app/services/api/entities/transcription.entity';
import * as editorSelector from 'src/app/store/selectors/editor.selector';
import { EditorUser } from 'src/app/interfaces/editor-user.interface';

@Injectable({
  providedIn: 'root',
})
export class TiptapEditorService {
  public speakerChanged$ = new Subject<void>();

  public speakers$ = new BehaviorSubject<SpeakerEntity[]>([]);
  public activeUsers$ = new BehaviorSubject<EditorUser[]>([]);

  constructor(private store: Store) {
    this.store
      .select(transcriptionsSelectors.selectAvailableSpeakers)
      .subscribe((speakers) => this.speakers$.next(speakers));

    this.store
      .select(editorSelector.selectActiveUsers)
      .subscribe((activeUsers) => this.activeUsers$.next(activeUsers));
  }

  getUserColor(userId: string) {
    const activeUsers = this.activeUsers$.getValue();
    return activeUsers.find((user) => user.id === userId)?.color || 'gray';
  }
}
