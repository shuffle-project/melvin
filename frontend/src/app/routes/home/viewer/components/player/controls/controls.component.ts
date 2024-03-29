import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LetDirective, PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';
import { DurationPipe } from '../../../../../../pipes/duration-pipe/duration.pipe';
import { MediaCategory } from '../../../../../../services/api/entities/project.entity';
import { TranscriptionEntity } from '../../../../../../services/api/entities/transcription.entity';
import * as editorActions from '../../../../../../store/actions/editor.actions';
import * as transcriptionsActions from '../../../../../../store/actions/transcriptions.actions';
import * as viewerActions from '../../../../../../store/actions/viewer.actions';
import { AppState } from '../../../../../../store/app.state';
import * as editorSelector from '../../../../../../store/selectors/editor.selector';
import * as transcriptionsSelector from '../../../../../../store/selectors/transcriptions.selector';
import * as viewerSelector from '../../../../../../store/selectors/viewer.selector';
import { ViewerService } from '../../../viewer.service';
import { CaptionsSettingsDialogComponent } from '../../captions-settings-dialog/captions-settings-dialog.component';
import { ViewerVideo } from '../player.component';

@Component({
  selector: 'app-controls',
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.scss'],
  standalone: true,
  imports: [
    MatSliderModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
    MatMenuModule,
    LetDirective,
    MatCheckboxModule,
    PushPipe,
    DurationPipe,
  ],
})
export class ControlsComponent {
  public volume$ = this.store.select(editorSelector.selectVolume);
  public currentSpeed$ = this.store.select(editorSelector.selectCurrentSpeed);
  public subtitlesEnabledInVideo$ = this.store.select(
    editorSelector.selectSubtitlesEnabledInVideo
  );

  public transcriptions$ = combineLatest([
    this.store.select(transcriptionsSelector.selectTranscriptionList),
    this.store.select(transcriptionsSelector.selectTranscriptionId),
  ]).pipe(
    map(([list, selectedId]) => {
      return { list, selectedId };
    })
  );

  public smallVideos$ = this.store.select(viewerSelector.selectSmallVideos);
  signLanguageAvailable$ = this.smallVideos$.pipe(
    map((smallVideos) => {
      const signLanguageVideos = smallVideos.findIndex(
        (element) => element.category === MediaCategory.SIGN_LANGUAGE
      );
      return signLanguageVideos < 0 ? false : true;
    })
  );

  constructor(
    private store: Store<AppState>,
    public viewerService: ViewerService,
    private dialog: MatDialog
  ) {}

  sliderLabelVolume(value: number): string {
    return Math.round(value * 100) + '%';
  }

  audioProgressLabel(value: number): string {
    const pipe = new DurationPipe();
    const transform = pipe.transform(value * 1000);
    return transform;
  }

  onPlayVideo() {
    this.viewerService.audio?.play();
  }
  onPauseVideo() {
    this.viewerService.audio?.pause();
  }

  onMuteAudio() {
    if (this.viewerService.audio) {
      this.viewerService.audio.muted = !this.viewerService.audio.muted;
    }
  }

  onVolumeChange(event: any) {
    this.store.dispatch(
      editorActions.changeVolumeFromViewerComponent({
        volume: event.target.value,
      })
    );
  }

  onToggleShowTranscript() {
    this.store.dispatch(viewerActions.toggleTranscript());
  }

  onTurnOffCaptions(subtitlesEnabledInVideo: boolean) {
    // disable captions in video
    if (subtitlesEnabledInVideo) {
      this.store.dispatch(editorActions.toggleSubtitlesFromViewer());
    }
  }

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

  onOpenCaptionsSettingsDialog() {
    this.viewerService.audio?.pause();
    // TODO do we want to play after closing the dialog??
    this.dialog.open(CaptionsSettingsDialogComponent);
  }

  // decreasePlaybackSpeed(currentSpeed: number) {
  //   if (currentSpeed > 0.25) this.changePlaybackSpeed((currentSpeed -= 0.25));
  // }
  // increasePlaybackSpeed(currentSpeed: number) {
  //   if (currentSpeed < 3) this.changePlaybackSpeed((currentSpeed += 0.25));
  // }

  changePlaybackSpeed(speed: number) {
    this.store.dispatch(editorActions.changeSpeedFromViewer({ speed }));
  }

  onSeek(seconds: number) {
    if (this.viewerService.audio) {
      this.viewerService.audio.currentTime += seconds;
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
    // this.store.dispatch(viewerActions.showTranscript());
  }

  onRequestFullscreen() {
    if (this.isFullscreenActive()) {
      this.onExitFullscreen();
    } else {
      const doc = document.getElementsByTagName('body').item(0);
      if (doc) {
        this.store.dispatch(viewerActions.hideTranscript());

        // show transcript again on closing fullscreen
        doc.onfullscreenchange = () => {
          if (!this.isFullscreenActive()) {
            this.store.dispatch(viewerActions.showTranscript());
          }
        };

        if (doc.requestFullscreen) {
          doc.requestFullscreen();
        } else if ((doc as any).webkitRequestFullscreen) {
          (doc as any).webkitRequestFullscreen();
        }
      }
    }
  }

  onToggleSignLanguageVideo() {
    this.store.dispatch(viewerActions.toggleSignLanguageVideos());
  }

  onClickToggleVideoShown(event: MouseEvent, video: ViewerVideo) {
    this.store.dispatch(viewerActions.toggleShowVideo({ id: video.id }));
    event.stopPropagation();
  }

  onKeypressToggleVideoShown(event: KeyboardEvent, video: ViewerVideo) {
    console.log(event.key);
    if (event.key === 'Enter' || event.key === ' ')
      this.store.dispatch(viewerActions.toggleShowVideo({ id: video.id }));
  }
}
