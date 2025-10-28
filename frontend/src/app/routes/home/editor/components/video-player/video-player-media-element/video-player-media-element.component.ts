
import {
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
  DOCUMENT
} from '@angular/core';
import { LetDirective, PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { Observable, Subject, map, takeUntil, tap } from 'rxjs';
import {
  LivestreamStatus,
  MediaCategory,
  ProjectStatus,
  VideoEntity,
} from '../../../../../../services/api/entities/project.entity';
import * as editorActions from '../../../../../../store/actions/editor.actions';
import { AppState } from '../../../../../../store/app.state';
import * as editorSelectors from '../../../../../../store/selectors/editor.selector';
import { LivestreamService } from '../../../../livestream/livestream.service';
import { MediaService } from '../../../service/media/media.service';

@Component({
  selector: 'app-video-player-media-element',
  templateUrl: './video-player-media-element.component.html',
  styleUrls: ['./video-player-media-element.component.scss'],
  imports: [LetDirective, PushPipe],
})
export class VideoPlayerMediaElementComponent implements OnInit, OnDestroy {
  @ViewChild('video', { static: false })
  videoRef!: ElementRef<HTMLVideoElement>;

  private destroy$$ = new Subject<void>();

  public playingVideo$ = this.store
    .select(editorSelectors.selectMedia)
    .pipe(
      map(
        (media) =>
          media?.videos.find(
            (video) => video.category === MediaCategory.MAIN
          ) || media?.videos[0]
      )
    );

  public project$ = this.store.select(editorSelectors.selectProject);

  public playbackRate$ = this.store.select(editorSelectors.selectCurrentSpeed);
  public volume$ = this.store.select(editorSelectors.selectVolume);
  public muted$ = this.store.select(editorSelectors.selectMuted);
  public currentTime$!: Observable<number>;

  get video(): HTMLVideoElement {
    return this.videoRef.nativeElement;
  }

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private store: Store<AppState>,
    private mediaService: MediaService,
    protected livestreamService: LivestreamService
  ) {}

  ngOnInit(): void {
    this.destroy$$ = new Subject();

    this.project$.subscribe((project) => {
      if (!project) return;
      if (
        project.status === ProjectStatus.LIVE &&
        project.livestream?.livestreamStatus !== LivestreamStatus.NOT_CONNECTED
      ) {
        if (!this.livestreamService.isConnected)
          this.livestreamService.connect(project.id!, this.videoRef);
      }
    });
  }

  onLoadedMetadata(playingVideo: VideoEntity | undefined) {
    // connect to state
    this.store
      .select(editorSelectors.eIsPlayingMedia)
      .pipe(
        takeUntil(this.destroy$$),
        tap(async (isPlaying) => {
          if (isPlaying && this.video.paused) {
            try {
              await this.video.play();
            } catch (e) {
              // This is fine
              // Play fails because user changed video or resolution
            }
          } else if (!isPlaying && !this.video.paused) {
            this.video.pause();
          }
        })
      )
      .subscribe();

    this.mediaService.seeking$
      .pipe(
        takeUntil(this.destroy$$),
        tap((seekTo: number) => this.seekToTime(seekTo))
      )
      .subscribe();

    this.mediaService.initMediaElement(this, playingVideo!);
  }

  async ngOnDestroy() {
    this.store.dispatch(editorActions.pauseFromVideoComponent());
    this.destroy$$.next();

    this.video.pause();
    this.video.replaceChildren(); // remove source element
    this.video.load();

    this.mediaService.destroyMediaElement();
    this.livestreamService.disconnect();
  }

  public seekToTime(milliseconds: number) {
    this.video.currentTime = Number((milliseconds / 1000).toFixed(6));
  }

  public togglePictureInPicture() {
    if (this.document.pictureInPictureElement) {
      this.document.exitPictureInPicture();
    } else {
      this.video.requestPictureInPicture();
    }
  }
}
