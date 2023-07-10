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
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Subject, combineLatest, map, takeUntil, tap } from 'rxjs';
import { DurationPipe } from '../../../../../pipes/duration-pipe/duration.pipe';
import {
  AdditionalVideo,
  ProjectEntity,
} from '../../../../../services/api/entities/project.entity';
import { TranscriptionEntity } from '../../../../../services/api/entities/transcription.entity';
import * as editorActions from '../../../../../store/actions/editor.actions';
import * as transcriptionsActions from '../../../../../store/actions/transcriptions.actions';
import { toggleTranscript } from '../../../../../store/actions/viewer.actions';
import { AppState } from '../../../../../store/app.state';
import * as captionsSelector from '../../../../../store/selectors/captions.selector';
import * as editorSelector from '../../../../../store/selectors/editor.selector';
import * as transcriptionsSelector from '../../../../../store/selectors/transcriptions.selector';
import * as viewerSelector from '../../../../../store/selectors/viewer.selector';
import { ViewerService } from '../../viewer.service';
import { CaptionsSettingsDialogComponent } from '../captions-settings-dialog/captions-settings-dialog.component';

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
  public subtitlesEnabledInVideo$ = this.store.select(
    editorSelector.selectSubtitlesEnabledInVideo
  );

  public transcriptions$ = this.store.select(
    transcriptionsSelector.selectTranscriptionList
  );
  public selectTranscriptionId$ = this.store.select(
    transcriptionsSelector.selectTranscriptionId
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
    private dialog: MatDialog,
    public viewerService: ViewerService
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (this.mainVideo.nativeElement)
      this.mainVideoHeight = this.mainVideo.nativeElement.offsetHeight;
  }

  // controls
  public volume: number = 1;
  public playbackSpeed: number = 1;

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
  onChangeTranscription(
    transcription: TranscriptionEntity,
    subtitlesEnabledInVideo: boolean
  ) {
    // enable captions in video
    if (!subtitlesEnabledInVideo) {
      this.store.dispatch(editorActions.toggleSubtitlesFromViewer());
    }

    this.store.dispatch(
      transcriptionsActions.selectFromViewer({
        transcriptionId: transcription.id,
      })
    );
  }

  onTurnOffCaptions(subtitlesEnabledInVideo: boolean) {
    // disable captions in video
    if (subtitlesEnabledInVideo) {
      this.store.dispatch(editorActions.toggleSubtitlesFromViewer());
    }
  }

  getVideoUrl(choosenAdditionalVideo: string): string {
    const video =
      this.project?.media?.additionalVideos.find(
        (ele) => ele.id === choosenAdditionalVideo
      ) || this.project!.media!.additionalVideos[0];

    return video.video;
  }

  // CONTROLS

  onPlayVideo() {
    this.audioPlayer?.play();
  }
  onPauseVideo() {
    this.audioPlayer?.pause();
  }

  onToggleShowTranscript() {
    this.store.dispatch(toggleTranscript());
  }

  onVolumeChange(event: any) {
    this.store.dispatch(
      editorActions.changeVolumeFromViewerComponent({
        volume: event.target.value,
      })
    );
  }

  decreasePlaybackSpeed() {
    if (this.playbackSpeed > 0.25) {
      this.playbackSpeed -= 0.25;
    }
  }
  increasePlaybackSpeed() {
    this.playbackSpeed += 0.25;
  }

  // HELPER
  sliderLabelVolume(value: number): string {
    return Math.round(value * 100) + '%';
  }

  audioProgressLabel(value: number): string {
    const pipe = new DurationPipe();
    const transform = pipe.transform(value * 1000);
    return transform;
  }

  onOpenCaptionsSettingsDialog() {
    this.dialog.open(CaptionsSettingsDialogComponent);
  }

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

  async onExitFullscreen() {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      await (document as any).webkitExitFullscreen();
    }
  }

  onRequestFullscreen() {
    if (this.isFullscreenActive()) {
      this.onExitFullscreen();
    } else {
      const doc = document.getElementById('fullscreenDiv');

      if (doc?.requestFullscreen) {
        doc.requestFullscreen({ navigationUI: 'hide' });
      } else if ((doc as any).webkitRequestFullscreen) {
        (doc as any).webkitRequestFullscreen({ navigationUI: 'hide' });
      }
    }
  }
}
