import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Subject } from 'rxjs';
import { EditorUserEntity } from 'src/app/interfaces/editor-user.interface';
import { MediaService } from 'src/app/routes/home/editor/service/media/media.service';
import { SpeakerEntity } from 'src/app/services/api/entities/transcription.entity';
import { EditorUser } from 'src/app/store/reducers/editor.reducer';
import * as editorSelector from 'src/app/store/selectors/editor.selector';
import * as transcriptionsSelectors from '../../../../store/selectors/transcriptions.selector';

@Injectable({
  providedIn: 'root',
})
export class TiptapViewerService {
  public speakerChanged$ = new Subject<void>();

  public speakers$ = new BehaviorSubject<SpeakerEntity[]>([]);
  public activeUsers$ = new BehaviorSubject<EditorUserEntity[]>([]);
  public editorUsers$ = new BehaviorSubject<EditorUser[]>([]);

  constructor(
    private store: Store,
    private mediaService: MediaService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
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
    return (
      editorUsers.find((user) => user.userId === userId)?.color || 'primary'
    );
  }

  clickWord(event: MouseEvent) {
    if (event.metaKey || event.ctrlKey) {
      const isMac =
        isPlatformBrowser(this.platformId) && /Mac/i.test(navigator.userAgent);

      if ((isMac && event.metaKey) || (!isMac && event.ctrlKey)) {
        const target = event?.target as HTMLElement;
        const start = target?.attributes.getNamedItem('data-start')?.value;
        if (start) {
          this.mediaService.seekToTime(+start, false);
        }
      }
    }
  }
}
