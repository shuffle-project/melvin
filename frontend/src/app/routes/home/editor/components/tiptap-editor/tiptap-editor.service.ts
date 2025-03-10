import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Subject } from 'rxjs';
import { EditorUserEntity } from 'src/app/interfaces/editor-user.interface';
import { SpeakerEntity } from 'src/app/services/api/entities/transcription.entity';
import { EditorUser } from 'src/app/store/reducers/editor.reducer';
import * as editorSelector from 'src/app/store/selectors/editor.selector';
import * as transcriptionsSelectors from '../../../../../store/selectors/transcriptions.selector';
import { MediaService } from '../../service/media/media.service';

@Injectable({
  providedIn: 'root',
})
export class TiptapEditorService {
  public speakerChanged$ = new Subject<void>();

  public speakers$ = new BehaviorSubject<SpeakerEntity[]>([]);
  public activeUsers$ = new BehaviorSubject<EditorUserEntity[]>([]);
  public editorUsers$ = new BehaviorSubject<EditorUser[]>([]);

  constructor(private store: Store, private mediaService: MediaService) {
    this.store
      .select(transcriptionsSelectors.selectAvailableSpeakers)
      .subscribe((speakers) => this.speakers$.next(speakers));

    this.store
      .select(editorSelector.selectActiveUsers)
      .subscribe((activeUsers) => this.activeUsers$.next(activeUsers));

    this.store
      .select(editorSelector.selectEditorUsers)
      .subscribe((editorUsers) => this.editorUsers$.next(editorUsers));
  }

  getUserColor(userId: string) {
    const editorUsers = this.editorUsers$.getValue();
    // console.log(editorUsers);
    return (
      editorUsers.find((user) => user.userId === userId)?.color || 'primary'
    );
  }

  clickWord(event: MouseEvent) {
    if (event.metaKey) {
      const target = event?.target as HTMLElement;
      const start = target?.attributes.getNamedItem('data-start')?.value;
      if (start) this.mediaService.seekToTime(+start, false);
    }
  }
}
