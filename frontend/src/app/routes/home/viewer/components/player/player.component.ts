import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject, combineLatest, map, takeUntil, tap } from 'rxjs';
import {
  AdditionalVideo,
  ProjectEntity,
} from '../../../../../services/api/entities/project.entity';
import { AppState } from '../../../../../store/app.state';
import * as captionsSelector from '../../../../../store/selectors/captions.selector';
import * as editorSelector from '../../../../../store/selectors/editor.selector';
import * as viewerSelector from '../../../../../store/selectors/viewer.selector';
import { ViewerService } from '../../viewer.service';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
})
export class PlayerComponent implements OnDestroy {
  private destroy$$ = new Subject<void>();

  @Input({ required: true }) project!: ProjectEntity | null;

  // main audio
  @ViewChild('viewerAudio') viewerAudio!: ElementRef;
  public audioPlayer: HTMLAudioElement | null = null;

  // main video
  @ViewChild('mainVideo') mainVideo!: ElementRef;
  mainVideoHeight = 300;

  @ViewChildren('secondaryVideo') secondaryVideoList!: QueryList<ElementRef>;

  mainVideoId: string = 'mainVideo';
  hiddenVideos: string[] = [];

  public audioLoaded = false;

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

  constructor(
    private store: Store<AppState>,

    public viewerService: ViewerService
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (this.mainVideo.nativeElement)
      this.mainVideoHeight = this.mainVideo.nativeElement.offsetHeight;
  }

  ngOnDestroy() {
    this.destroy$$.next();
  }

  // VIDEO

  onChangeMainVideo(videoId: string) {
    this.mainVideoId = videoId;
    this.mainVideo.nativeElement.load();
  }

  onAudioLoadMetadata() {
    this.audioPlayer = this.viewerAudio.nativeElement;

    this.viewerService.initObservables(this.audioPlayer!, this.project!.id);
    this.audioLoaded = true;
  }

  onVideoLoadMetadata(event: Event) {
    this.connectToAudio(event);

    if (this.mainVideo.nativeElement)
      this.mainVideoHeight = this.mainVideo.nativeElement.offsetHeight;
  }

  connectToAudio(event: Event) {
    const videoPlayer = event.target as HTMLVideoElement;

    // current state
    if (this.audioPlayer) {
      videoPlayer.currentTime = this.audioPlayer?.currentTime;
      if (!this.audioPlayer.paused) {
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

  // DATA

  getVideoUrl(choosenAdditionalVideo: string): string {
    const video =
      this.project?.media?.additionalVideos.find(
        (ele) => ele.id === choosenAdditionalVideo
      ) || this.project!.media!.additionalVideos[0];

    return video.video;
  }

  // CONTROLS

  // HELPER

  // CONTROLS SECONDARY VIDEOS
  onClickMenuItem(event: Event, video: AdditionalVideo | null) {
    const id = video ? video.id : 'mainVideo';
    const checked = !this.hiddenVideos.includes(id);

    if (checked) {
      console.log('remove through click');
      this.hiddenVideos.splice(this.hiddenVideos.indexOf(id), 1);
    } else {
      console.log('psuh through click');
      this.hiddenVideos.push(id);
    }

    event.stopPropagation();
  }

  onChangeViewsMenu(checked: boolean, video: AdditionalVideo | null) {
    const id = video ? video.id : 'mainVideo';

    if (checked) {
      this.hiddenVideos.splice(this.hiddenVideos.indexOf(id), 1);
    } else {
      this.hiddenVideos.push(id);
    }
  }

  isFullscreenActive() {
    return (
      document.fullscreenElement || (document as any).webkitFullscreenElement
    );
  }
}
