import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { Store } from '@ngrx/store';

import { Subject, takeUntil, tap } from 'rxjs';
import * as viewerActions from '../../../../../../store/actions/viewer.actions';
import { AppState } from '../../../../../../store/app.state';
import * as editorSelector from '../../../../../../store/selectors/editor.selector';
import * as viewerSelector from '../../../../../../store/selectors/viewer.selector';
import { ViewerService } from '../../../viewer.service';

@Component({
  selector: 'app-video-container',
  templateUrl: './video-container.component.html',
  styleUrls: ['./video-container.component.scss'],
})
export class VideoContainerComponent implements OnDestroy {
  private destroy$$ = new Subject<void>();

  @Input({ required: true }) size!: 'big' | 'small';
  @Input({ required: true }) id!: string;
  @Input({ required: true }) url!: string;
  @Input({ required: true }) title!: string;

  @Output() public videoMetadataLoaded = new EventEmitter<void>();

  public currentSpeed$ = this.store.select(editorSelector.selectCurrentSpeed);
  public bigVideoId$ = this.store.select(viewerSelector.selectBigVideoId);
  // centeredVideo$
  // hiddenVideos$

  constructor(
    private store: Store<AppState>,
    public viewerService: ViewerService
  ) {}

  ngOnDestroy(): void {
    this.destroy$$.next();
  }

  onChangeMainVideo() {
    this.store.dispatch(
      viewerActions.changeBigVideoId({ newVideoId: this.id })
    );
  }

  onVideoLoadMetadata(event: Event) {
    this.connectToAudio(event);

    this.videoMetadataLoaded.emit();
  }

  connectToAudio(event: Event) {
    const videoPlayer = event.target as HTMLVideoElement;

    // current state
    if (this.viewerService.audio) {
      videoPlayer.currentTime = this.viewerService.audio.currentTime;
      if (!this.viewerService.audio.paused) {
        videoPlayer.play();
      }
    }

    // future state
    this.viewerService.play$
      .pipe(
        takeUntil(this.destroy$$),
        tap(() => videoPlayer.play())
      )
      .subscribe();

    this.viewerService.pause$
      .pipe(
        takeUntil(this.destroy$$),
        tap(() => videoPlayer.pause())
      )
      .subscribe();

    this.viewerService.seeking$
      .pipe(
        takeUntil(this.destroy$$),
        tap((seekTo: number) => (videoPlayer.currentTime = seekTo))
      )
      .subscribe();
  }
}
