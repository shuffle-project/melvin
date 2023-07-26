import {
  FullscreenOverlayContainer,
  OverlayContainer,
} from '@angular/cdk/overlay';
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
import { Store } from '@ngrx/store';
import { Subject, combineLatest, map, takeUntil, tap } from 'rxjs';
import {
  AdditionalVideo,
  ProjectEntity,
} from '../../../../../services/api/entities/project.entity';
import * as viewerActions from '../../../../../store/actions/viewer.actions';
import { AppState } from '../../../../../store/app.state';
import * as captionsSelector from '../../../../../store/selectors/captions.selector';
import * as editorSelector from '../../../../../store/selectors/editor.selector';
import * as viewerSelector from '../../../../../store/selectors/viewer.selector';
import { ViewerService } from '../../viewer.service';

export interface ViewerVideo {
  id: string;
  title: string;
  url: string;
  shown: boolean;
}

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
  providers: [
    { provide: OverlayContainer, useClass: FullscreenOverlayContainer },
  ],
})
export class PlayerComponent implements OnDestroy, AfterViewInit, OnInit {
  private destroy$$ = new Subject<void>();

  @Input({ required: true }) project!: ProjectEntity;

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

  public mainVideoHeight = 300;
  public resizerHeightPx = 0;

  public volume$ = this.store.select(editorSelector.selectVolume);
  public currentSpeed$ = this.store.select(editorSelector.selectCurrentSpeed);
  public subtitlesEnabledInVideo$ = this.store.select(
    editorSelector.selectSubtitlesEnabledInVideo
  );

  public captions$ = this.store.select(captionsSelector.selectCaptions);

  // captions in video
  combinedCaptionsStyling$ = combineLatest([
    this.captions$,
    this.store.select(viewerSelector.selectCaptionsBackgroundColor),
    this.store.select(viewerSelector.selectCaptionsColor),
    this.store.select(viewerSelector.selectCaptionFontsize),
    this.store.select(viewerSelector.selectCaptionPosition),
  ]).pipe(
    map(([captions, backgroundColor, color, fontsize, position]) => {
      return { captions, backgroundColor, color, fontsize, position };
    })
  );

  public bigVideo$ = this.store.select(viewerSelector.selectBigVideo);
  public smallVideos$ = this.store.select(viewerSelector.selectSmallVideos);
  public shownSmallVideos$ = this.smallVideos$.pipe(
    map((list) => list.filter((video) => video.shown))
  );
  public shownSmallVideosCount$ = this.shownSmallVideos$.pipe(
    map((list) => list.length)
  );

  // helper variables for dragndrop
  private resizingVideoWidth = false;
  private initialClientX = 0;
  private initialMainVideoContainerWidth = 0;

  public mainVideoContainerWidthPercent = 74;

  constructor(
    private store: Store<AppState>,
    public viewerService: ViewerService,
    private ref: ChangeDetectorRef
  ) {
    this.viewerService.isLoading('audio');
  }

  ngOnInit() {
    const videos: ViewerVideo[] = [
      {
        id: this.project!.id,
        title: 'Hauptviedeo',
        url: this.project!.media!.video,
        shown: true,
      },
    ];
    this.project.media?.additionalVideos.forEach((element: AdditionalVideo) => {
      videos.push({
        ...element,
        shown: true,
      });
    });

    this.store.dispatch(
      viewerActions.initVideos({
        viewerVideos: videos,
        bigVideoId: this.project!.id,
      })
    );
  }

  ngAfterViewInit(): void {
    this.store
      .select(viewerSelector.selectTranscriptEnabled)
      .pipe(
        takeUntil(this.destroy$$),
        tap(() => {
          setTimeout(() => {
            this.resetVideoDimensions();
          }, 1);
        })
      )
      .subscribe();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.resetVideoDimensions();
  }

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

    this.resetVideoDimensions();
  }

  /**
   * resetting video dimensions according to main video height
   */
  resetVideoDimensions() {
    // get height of main video to adjust secondary container
    const firstVideo = document.getElementsByTagName('video');

    if (firstVideo.item(0)) {
      this.mainVideoHeight = firstVideo.item(0)!.offsetHeight;
    }
    this.resizerHeightPx = this.allVideosContainer.clientHeight * 0.9;

    this.ref.detectChanges();
  }

  onSwitchToBigVideo(viewerVideo: ViewerVideo) {
    this.store.dispatch(
      viewerActions.switchToNewBigVideo({ newBigVideoId: viewerVideo.id })
    );
  }

  onClickToggleVideoShown(event: MouseEvent, video: ViewerVideo) {
    this.store.dispatch(viewerActions.toggleShowVideo({ id: video.id }));
    event.stopPropagation();
  }

  onKeypressToggleVideoShown(event: KeyboardEvent, video: ViewerVideo) {
    if (event.key === 'Enter' || event.key === 'Space')
      this.store.dispatch(viewerActions.toggleShowVideo({ id: video.id }));
  }

  onAudioLoadMetadata(event: Event) {
    this.audioPlayer = event.target as HTMLAudioElement;

    this.viewerService.initAudioObservables(
      this.audioPlayer!,
      this.project!.id
    );
  }
}
