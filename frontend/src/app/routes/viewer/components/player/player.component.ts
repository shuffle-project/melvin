import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  FullscreenOverlayContainer,
  OverlayContainer,
} from '@angular/cdk/overlay';
import { NgStyle } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LetDirective, PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import {
  Subject,
  combineLatest,
  distinctUntilChanged,
  map,
  of,
  switchMap,
  timer,
  withLatestFrom,
} from 'rxjs';
import {
  AudioEntity,
  ProjectEntity,
  ProjectMediaEntity,
  VideoEntity,
} from '../../../../services/api/entities/project.entity';
import * as viewerActions from '../../../../store/actions/viewer.actions';
import { AppState } from '../../../../store/app.state';
import * as viewerSelector from '../../../../store/selectors/viewer.selector';
import { OverlayService } from '../../services/overlay.service';
import { ViewerService } from '../../services/viewer.service';
import { VideoContainerComponent } from './video-container/video-container.component';

export interface ViewerVideo extends VideoEntity {
  shown: boolean;
}

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
  providers: [
    { provide: OverlayContainer, useClass: FullscreenOverlayContainer },
  ],
  imports: [
    MatProgressSpinnerModule,
    LetDirective,
    VideoContainerComponent,
    NgStyle,
    PushPipe,
  ],
  animations: [
    trigger('fade', [
      state('show', style({ opacity: 1 })),
      state('hide', style({ opacity: 0 })),
      transition('hide => show', [style({ opacity: 1 })]),
      transition('show => hide', [animate(0, style({ opacity: 0 }))]),
    ]),
  ],
})
export class PlayerComponent implements OnDestroy, AfterViewInit, OnInit {
  private destroy$$ = new Subject<void>();

  @Input({ required: true }) project!: ProjectEntity;
  @Input({ required: true }) media!: ProjectMediaEntity;
  playingAudio: AudioEntity | null = null;

  @ViewChild('allVideosContainerRef')
  private _allVideosContainerRef!: ElementRef<HTMLDivElement>;
  get allVideosContainer() {
    return this._allVideosContainerRef.nativeElement;
  }

  @ViewChild('mainVideoContainerRef')
  private _mainVideoContainerRef!: ElementRef<HTMLDivElement>;
  get mainVideoContainer() {
    return this._mainVideoContainerRef.nativeElement;
  }

  public audioPlayer: HTMLAudioElement | null = null;

  public volume$ = this.store.select(viewerSelector.vVolume);
  public muted$ = this.store.select(viewerSelector.vMuted);
  public currentSpeed$ = this.store.select(viewerSelector.vCurrentSpeed);
  public subtitlesEnabled$ = this.store.select(
    viewerSelector.vSubtitlesEnabled
  );

  public transcriptOnlyMode$ = this.store.select(
    viewerSelector.vTranscriptOnly
  );

  public captions$ = this.store.select(viewerSelector.vCaptions);
  public currentCaptionText$ = this.viewerService.currentCaption$.pipe(
    map((caption) => caption?.text.replace('\n', '<br>') || '-')
  );

  // captions in video
  combinedCaptionsStyling$ = combineLatest([
    this.captions$,
    this.store.select(viewerSelector.vCaptionsBackgroundColor),
    this.store.select(viewerSelector.vCaptionsColor),
    this.store.select(viewerSelector.vCaptionFontsize),
    this.store.select(viewerSelector.vCaptionPosition),
  ]).pipe(
    map(([captions, backgroundColor, color, fontsize, position]) => {
      return { captions, backgroundColor, color, fontsize, position };
    })
  );

  public bigVideo$ = this.store.select(viewerSelector.vBigVideo);
  public smallVideos$ = this.store.select(viewerSelector.vViewerVideos).pipe(
    withLatestFrom(this.bigVideo$),
    map(([list, bigVideo]) =>
      list.filter((video) => video.shown && video.id !== bigVideo?.id)
    )
  );

  public shownSmallVideos$ = this.smallVideos$.pipe(
    map((list) => list.filter((video) => video.shown))
  );
  public shownSmallVideosCount$ = this.shownSmallVideos$.pipe(
    map((list) => list.length)
  );

  showLoadingSpinner$ = this.store
    .select(viewerSelector.vShowLoadingSpinner)
    .pipe(
      switchMap((value) =>
        value ? timer(400).pipe(map(() => true)) : of(false)
      ),
      distinctUntilChanged()
    );

  // helper variables for dragndrop
  private resizingVideoWidth = false;
  private initialClientX = 0;
  private initialMainVideoContainerWidth = 0;

  public mainVideoContainerWidthPercent = 74;

  constructor(
    private store: Store<AppState>,
    public viewerService: ViewerService,
    private ref: ChangeDetectorRef,
    public overlayService: OverlayService
  ) {}

  ngOnInit() {
    this.chooseAudio();
  }

  chooseAudio() {
    const mp3 = this.media.audios.find((obj) => obj.extension === 'mp3');
    if (mp3) {
      this.playingAudio = mp3;
    } else if (this.media.audios.length > 0) {
      this.playingAudio = this.media.audios[0];
    } else {
      // TODO
    }
  }

  ngAfterViewInit(): void {}

  ngOnDestroy() {
    this.destroy$$.next();
  }

  onMouseDown(event: MouseEvent) {
    event.preventDefault();

    // console.log(event.clientX);
    this.initialClientX = event.clientX;
    this.initialMainVideoContainerWidth =
      this.mainVideoContainer.getBoundingClientRect().width;

    this.resizingVideoWidth = true;
    document.body.style.cursor = 'col-resize';
  }

  @HostListener('window:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    if (this.resizingVideoWidth) {
      this.resizingVideoWidth = false;
      document.body.style.cursor = '';
    }
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.resizingVideoWidth) {
      this.adjustMainVideoWidthWithMouse(event.clientX);
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') {
      if (event.ctrlKey) {
        this.adjustMainVideoWidthWithPx(-50);
      } else {
        this.adjustMainVideoWidthWithPx(-5);
      }
    } else if (event.key === 'ArrowRight') {
      if (event.ctrlKey) {
        this.adjustMainVideoWidthWithPx(50);
      } else {
        this.adjustMainVideoWidthWithPx(5);
      }
    }
  }

  /**
   * @param movement
   * increase or decrease the size of the main video by <movement>px to the decalred min/max, default is 30%/85%
   */
  private adjustMainVideoWidthWithPx(movement: number) {
    const allVideosContainerWidth =
      this.allVideosContainer.getBoundingClientRect().width;
    const mainVideoContainerWidth =
      this.mainVideoContainer.getBoundingClientRect().width;
    const newVideoContainerWidthPx = mainVideoContainerWidth + movement;

    const newPercent =
      (newVideoContainerWidthPx / allVideosContainerWidth) * 100;

    this.setMainVideoWidthPercentage(newPercent);
  }

  /**
   * @param movement
   * increase or decrease the size of the main video by <movement>px to the decalred min/max, default is 30%/85%
   */
  private adjustMainVideoWidthWithMouse(clientX: number) {
    const allVideosContainerWidth =
      this.allVideosContainer.getBoundingClientRect().width;

    const totalMovement = clientX - this.initialClientX;

    const newPercent =
      ((this.initialMainVideoContainerWidth + totalMovement) /
        allVideosContainerWidth) *
      100;

    this.setMainVideoWidthPercentage(newPercent);
  }

  private setMainVideoWidthPercentage(
    newPercent: number,
    maximumWidth = 85,
    minimumWidth = 30
  ) {
    if (newPercent > maximumWidth) {
      this.mainVideoContainerWidthPercent = maximumWidth;
    } else if (newPercent < minimumWidth) {
      this.mainVideoContainerWidthPercent = minimumWidth;
    } else {
      this.mainVideoContainerWidthPercent = newPercent;
    }
  }

  onSwitchToBigVideo(viewerVideo: ViewerVideo) {
    this.store.dispatch(
      viewerActions.switchToNewBigVideo({ newBigVideoId: viewerVideo.id })
    );
  }

  onAudioLoadMetadata(event: Event) {
    this.audioPlayer = event.target as HTMLAudioElement;

    this.viewerService.initAudioObservables(
      this.audioPlayer!,
      this.project!.id
    );
  }
}
