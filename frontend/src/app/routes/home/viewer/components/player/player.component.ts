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
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Subject, combineLatest, map } from 'rxjs';
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
    this.audioLoaded = true;
    this.audioPlayer = this.viewerAudio.nativeElement;

    this.viewerService.initObservables(this.audioPlayer!, this.project!.id);
  }

  onVideoLoadMetadataSecondVideo() {
    if (this.audioPlayer) this.setCurrentTimeOnVideos();
  }

  onVideoLoadMetadata() {
    if (this.mainVideo.nativeElement)
      this.mainVideoHeight = this.mainVideo.nativeElement.offsetHeight;

    if (this.audioPlayer) this.setCurrentTimeOnVideos();
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
    if (this.audioPlayer) {
      this.audioPlayer.play();
      this.playVideos();
    }
  }
  onPauseVideo() {
    if (this.audioPlayer) {
      this.audioPlayer.pause();
      this.pauseVideos();
    }
  }

  onVideoProgressChange(event: any) {
    console.log('input', event.target.value);
    if (this.audioPlayer) {
      this.setCurrentTimeOnVideos();
    }
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

  onOpenCaptionsSettingsDialog() {
    this.dialog.open(CaptionsSettingsDialogComponent);
  }

  onResizeMainVideo(event: any) {
    console.log(event);
  }

  // CONTROLS SECONDARY VIDEOS

  onChangeViewsMenu(event: MatCheckboxChange, video: AdditionalVideo | null) {
    if (event.checked) {
      if (!video) {
        this.hiddenVideos.splice(this.hiddenVideos.indexOf('mainVideo'), 1);
      } else if (this.hiddenVideos.includes(video.id)) {
        this.hiddenVideos.splice(this.hiddenVideos.indexOf(video.id), 1);
      }
    } else {
      if (!video) {
        this.hiddenVideos.push('mainVideo');
      } else {
        this.hiddenVideos.push(video.id);
      }
    }
  }

  setCurrentTimeOnVideos() {
    if (this.mainVideo.nativeElement) {
      this.mainVideo.nativeElement.currentTime = this.audioPlayer?.currentTime;
      if (!this.audioPlayer?.paused && this.mainVideo.nativeElement.paused) {
        this.mainVideo.nativeElement.play();
      }
    }

    this.secondaryVideoList.forEach((element) => {
      if (element.nativeElement) {
        element.nativeElement.currentTime = this.audioPlayer?.currentTime;
        if (!this.audioPlayer?.paused && element.nativeElement.paused) {
          element.nativeElement.play();
        }
      }
    });
  }

  // onCanPlayAudio(event: any) {
  //   console.log(event);
  // }

  playVideos() {
    if (this.mainVideo.nativeElement) {
      this.mainVideo.nativeElement.currentTime = this.audioPlayer?.currentTime;
      this.mainVideo.nativeElement.play();
    }

    this.secondaryVideoList.forEach((element) => {
      if (element.nativeElement) {
        element.nativeElement.currentTime = this.audioPlayer?.currentTime;
        element.nativeElement.play();
      }
    });
  }

  pauseVideos() {
    if (this.mainVideo.nativeElement) {
      this.mainVideo.nativeElement.pause();
      this.mainVideo.nativeElement.currentTime = this.audioPlayer?.currentTime;
    }

    this.secondaryVideoList.map((element) => {
      if (element.nativeElement) {
        element.nativeElement.pause();
        element.nativeElement.currentTime = this.audioPlayer?.currentTime;
      }
    });
  }
}
