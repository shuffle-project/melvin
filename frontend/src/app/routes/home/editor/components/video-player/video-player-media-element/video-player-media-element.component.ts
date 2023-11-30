import { DOCUMENT, NgIf } from '@angular/common';
import {
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';
import {
  Observable,
  Subject,
  animationFrameScheduler,
  distinctUntilChanged,
  filter,
  fromEvent,
  interval,
  map,
  merge,
  takeUntil,
  tap,
} from 'rxjs';
import {
  LivestreamStatus,
  ProjectStatus,
} from '../../../../../../services/api/entities/project.entity';
import * as editorActions from '../../../../../../store/actions/editor.actions';
import { AppState } from '../../../../../../store/app.state';
import * as editorSelectors from '../../../../../../store/selectors/editor.selector';
import { LivestreamService } from '../../../../livestream/livestream.service';
import { MediaService } from '../../../services/media/media.service';
import { LetDirective, PushPipe } from '@ngrx/component';

@Component({
    selector: 'app-video-player-media-element',
    templateUrl: './video-player-media-element.component.html',
    styleUrls: ['./video-player-media-element.component.scss'],
    standalone: true,
    imports: [
        LetDirective,
        NgIf,
        PushPipe,
    ],
})
export class VideoPlayerMediaElementComponent implements OnInit, OnDestroy {
  @ViewChild('video', { static: false })
  videoRef!: ElementRef<HTMLVideoElement>;

  private destroy$$ = new Subject<void>();

  public src$ = this.store
    .select(editorSelectors.selectProject)
    .pipe(map((project) => project?.media?.video));

  public project$ = this.store.select(editorSelectors.selectProject);

  public playbackRate$ = this.store.select(editorSelectors.selectCurrentSpeed);
  public volume$ = this.store.select(editorSelectors.selectVolume);
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

  onLoadedMetadata() {
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement#events
    this.currentTime$ = merge(
      fromEvent(this.video, 'timeupdate').pipe(
        map((o) => (o.target as HTMLMediaElement).currentTime)
      ),
      fromEvent(this.video, 'seeking').pipe(
        map((o) => (o.target as HTMLMediaElement).currentTime)
      ),
      //TODO: Maybe start stop interval on media.playing and media.pause
      interval(0, animationFrameScheduler).pipe(
        filter(() => !this.video.paused),
        map(() => this.video.currentTime)
      )
    ).pipe(
      takeUntil(this.destroy$$),
      distinctUntilChanged(),
      map((seconds) => seconds * 1000)
    );

    this.store
      .select(editorSelectors.selectIsPlaying)
      .pipe(
        takeUntil(this.destroy$$),
        tap((isPlaying) => {
          if (isPlaying && this.video.paused) {
            this.video.play();
          } else if (!isPlaying && !this.video.paused) {
            this.video.pause();
          }
        })
      )
      .subscribe();

    this.mediaService.initMediaElement(this);
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
