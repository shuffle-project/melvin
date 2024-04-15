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
import { DurationPipe } from '../../../../../pipes/duration-pipe/duration.pipe';
import { MediaCategory } from '../../../../../services/api/entities/project.entity';
import { TranscriptionEntity } from '../../../../../services/api/entities/transcription.entity';
import { toggleDarkModeFromViewer } from '../../../../../store/actions/config.actions';
import * as viewerActions from '../../../../../store/actions/viewer.actions';
import { AppState } from '../../../../../store/app.state';
import * as configSelector from '../../../../../store/selectors/config.selector';
import * as viewerSelector from '../../../../../store/selectors/viewer.selector';
import { ViewerService } from '../../../../viewer/viewer.service';
import { TranscriptPosition } from '../../../viewer.interfaces';
import { AdjustLayoutDialogComponent } from '../../adjust-layout-dialog/adjust-layout-dialog.component';
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
  public tanscriptPositionENUM = TranscriptPosition;

  public volume$ = this.store.select(viewerSelector.vVolume);
  public currentSpeed$ = this.store.select(viewerSelector.vCurrentSpeed);
  public darkMode$ = this.store.select(configSelector.darkMode);
  public subtitlesEnabledInVideo$ = this.store.select(
    viewerSelector.vSubtitlesEnabled
  );

  public transcriptions$ = combineLatest([
    this.store.select(viewerSelector.vTranscriptions),
    this.store.select(viewerSelector.vTranscriptionId),
  ]).pipe(map(([list, selectedId]) => ({ list, selectedId })));

  transcriptPosition$ = this.store.select(viewerSelector.vTranscriptPosition);
  public smallVideos$ = this.store.select(viewerSelector.vSmallVideos);
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
      viewerActions.changeVolume({
        newVolume: event.target.value,
      })
    );
  }

  onChangeTranscriptPosition(transcriptPosition: TranscriptPosition) {
    this.store.dispatch(
      viewerActions.changeTranscriptPosition({ transcriptPosition })
    );
  }

  onTurnOffCaptions(subtitlesEnabledInVideo: boolean) {
    // disable captions in video
    if (subtitlesEnabledInVideo) {
      this.store.dispatch(viewerActions.toggleSubtitles());
    }
  }

  onChangeCaptions(switchTo: boolean, switchFrom: boolean) {
    if (switchTo !== switchFrom) {
      this.store.dispatch(viewerActions.toggleSubtitles());
    }
  }

  onChangeTranscription(
    transcription: TranscriptionEntity
    // subtitlesEnabledInVideo: boolean
  ) {
    // enable captions in video
    // if (!subtitlesEnabledInVideo) {
    //   this.store.dispatch(viewerActions.toggleSubtitles());
    // }

    this.store.dispatch(
      viewerActions.changeTranscriptionId({ transcriptionId: transcription.id })
    );
  }

  onOpenCaptionsSettingsDialog() {
    this.viewerService.audio?.pause();
    // TODO do we want to play after closing the dialog??
    this.dialog.open(CaptionsSettingsDialogComponent);
  }

  onOpenTranscriptSettingsDialog() {
    this.viewerService.audio?.pause();
    // TODO do we want to play after closing the dialog??
    this.dialog.open(AdjustLayoutDialogComponent);
  }

  // decreasePlaybackSpeed(currentSpeed: number) {
  //   if (currentSpeed > 0.25) this.changePlaybackSpeed((currentSpeed -= 0.25));
  // }
  // increasePlaybackSpeed(currentSpeed: number) {
  //   if (currentSpeed < 3) this.changePlaybackSpeed((currentSpeed += 0.25));
  // }

  changePlaybackSpeed(newSpeed: number) {
    this.store.dispatch(viewerActions.changeSpeed({ newSpeed }));
  }

  onSeek(seconds: number) {
    if (this.viewerService.audio) {
      this.viewerService.audio.currentTime += seconds;
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

  onToggleDarkmode(darkModeCurrent: boolean, darkModeNew: boolean) {
    if (darkModeCurrent !== darkModeNew) {
      this.store.dispatch(toggleDarkModeFromViewer());
    }
  }
}
