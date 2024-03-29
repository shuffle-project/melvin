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
  OnChanges,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LetDirective, PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { Subject, combineLatest, map } from 'rxjs';
import {
  AudioEntity,
  ProjectEntity,
  ProjectMediaEntity,
  VideoEntity,
} from '../../../../../services/api/entities/project.entity';
import * as viewerActions from '../../../../../store/actions/viewer.actions';
import { AppState } from '../../../../../store/app.state';
import * as captionsSelector from '../../../../../store/selectors/captions.selector';
import * as editorSelector from '../../../../../store/selectors/editor.selector';
import * as viewerSelector from '../../../../../store/selectors/viewer.selector';
import { ViewerService } from '../../viewer.service';
import { ControlsComponent } from './controls/controls.component';
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
  standalone: true,
  imports: [
    MatProgressSpinnerModule,
    LetDirective,
    VideoContainerComponent,
    NgStyle,
    ControlsComponent,
    PushPipe,
  ],
})
export class PlayerComponent
  implements OnDestroy, AfterViewInit, OnInit, OnChanges
{
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

  public volume$ = this.store.select(editorSelector.selectVolume);
  public currentSpeed$ = this.store.select(editorSelector.selectCurrentSpeed);
  public subtitlesEnabledInVideo$ = this.store.select(
    editorSelector.selectSubtitlesEnabledInVideo
  );

  public transcriptOnlyMode$ = this.store.select(
    viewerSelector.selectTranscriptOnlyMode
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
    this.setVideosInStore();
    this.chooseAudio();
  }

  ngOnChanges(): void {
    this.setVideosInStore();
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

  //TODO maybe move this method to store, as a following action from the findOneProject
  setVideosInStore() {
    // const videos: ViewerVideo[] = [
    //   {
    //     id: this.project!.id,
    //     title: 'Hauptviedeo',
    //     url: this.project!.media!.video,
    //     category: MediaCategory.MAIN,
    //     shown: true,
    //   },
    // ];
    this.store.dispatch(
      viewerActions.initVideos({
        viewerVideos: this.media.videos.map((video) => ({
          ...video,
          shown: true,
        })),
        bigVideoId: this.media.videos[0].id,
      })
    );
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

  // onClickToggleVideoShown(event: MouseEvent, video: ViewerVideo) {
  //   this.store.dispatch(viewerActions.toggleShowVideo({ id: video.id }));
  //   event.stopPropagation();
  // }

  // onKeypressToggleVideoShown(event: KeyboardEvent, video: ViewerVideo) {
  //   if (event.key === 'Enter' || event.key === 'Space')
  //     this.store.dispatch(viewerActions.toggleShowVideo({ id: video.id }));
  // }

  onAudioLoadMetadata(event: Event) {
    this.audioPlayer = event.target as HTMLAudioElement;

    this.viewerService.initAudioObservables(
      this.audioPlayer!,
      this.project!.id
    );
  }
}
