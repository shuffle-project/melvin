import { CdkMenuModule } from '@angular/cdk/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { AsyncPipe } from '@angular/common';
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
import { MenuItemCheckboxDirective } from '../../../../../directives/cdkMenuCheckbox/cdk-menu-item-checkbox.directive';
import { MenuItemRadioDirective } from '../../../../../directives/cdkMenuRadio/cdk-menu-item-radio.directive';
import { DurationPipe } from '../../../../../pipes/duration-pipe/duration.pipe';
import { TranscriptionEntity } from '../../../../../services/api/entities/transcription.entity';
import { toggleDarkModeFromViewer } from '../../../../../store/actions/config.actions';
import * as viewerActions from '../../../../../store/actions/viewer.actions';
import { AppState } from '../../../../../store/app.state';
import * as configSelector from '../../../../../store/selectors/config.selector';
import * as viewerSelector from '../../../../../store/selectors/viewer.selector';
import { OverlayService } from '../../../services/overlay.service';
import { ViewerService } from '../../../services/viewer.service';
import { TranscriptPosition } from '../../../viewer.interfaces';
import { AdjustLayoutDialogComponent } from '../../adjust-layout-dialog/adjust-layout-dialog.component';
import { CaptionsSettingsDialogComponent } from '../../captions-settings-dialog/captions-settings-dialog.component';
import { HelpDialogComponent } from '../../help-dialog/help-dialog.component';
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
    CdkMenuModule,
    MenuItemRadioDirective,
    MenuItemCheckboxDirective,
    OverlayModule,
    AsyncPipe,
  ],
})
export class ControlsComponent {
  volumeOverlayOpen = false;

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
  public transcriptPosition$ = this.store.select(
    viewerSelector.vTranscriptPosition
  );
  public bigVideo$ = this.store.select(viewerSelector.vBigVideo);

  public vViewerVideos$ = this.store.select(viewerSelector.vViewerVideos);

  constructor(
    private store: Store<AppState>,
    public viewerService: ViewerService,
    private dialog: MatDialog,
    public overlayService: OverlayService
  ) {}

  sliderLabelVolume(value: number): string {
    return Math.round(value * 100) + '%';
  }

  audioProgressLabel(value: number): string {
    const pipe = new DurationPipe();
    const transform = pipe.transform(value * 1000);
    return transform;
  }

  onPlayPauseVideo() {
    if (this.viewerService.audio?.paused) {
      this.viewerService.audio.play();
    } else {
      this.viewerService.audio?.pause();
    }
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

  onClickMenuItem(event: MouseEvent, button: HTMLButtonElement) {
    console.log(event, button);
    (event.target as any).trigger({ keepOpen: true });
  }

  onChangeTranscriptPosition(transcriptPosition: TranscriptPosition) {
    this.store.dispatch(
      viewerActions.changeTranscriptPosition({ transcriptPosition })
    );
  }

  onChangeCaptions(switchTo: boolean, switchFrom: boolean) {
    if (switchTo !== switchFrom) {
      this.store.dispatch(viewerActions.toggleSubtitles());
    }
  }

  newonClickMenuItem(event: MouseEvent, button: HTMLButtonElement) {
    console.log(event, button);
  }

  onChangeTranscription(transcription: TranscriptionEntity) {
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

  onOpenHelpDialog() {
    this.viewerService.audio?.pause();
    this.dialog.open(HelpDialogComponent);
  }

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

  onClickToggleVideoShown(
    video: ViewerVideo,
    bigVideoId: ViewerVideo | undefined,
    videos: ViewerVideo[]
  ) {
    if (bigVideoId?.id === video.id) {
      const makeNewBig = videos.find(
        (video) => video.shown && video.id !== bigVideoId.id
      );
      if (makeNewBig) {
        this.store.dispatch(
          viewerActions.switchToNewBigVideo({ newBigVideoId: makeNewBig.id })
        );
      }
    }
    this.store.dispatch(viewerActions.toggleShowVideo({ id: video.id }));
  }

  onToggleDarkmode(darkModeCurrent: boolean, darkModeNew: boolean) {
    if (darkModeCurrent !== darkModeNew) {
      this.store.dispatch(toggleDarkModeFromViewer());
    }
  }

  onMenuOpened() {
    this.overlayService.menuOpen$.next(true);
  }

  onMenuClosed() {
    this.overlayService.menuOpen$.next(false);
  }

  onChangeCurrentTime(newTime: string) {
    this.viewerService.onJumpInAudio(+newTime * 1000);
  }

  onKeypressChangeCurrentTime(event: KeyboardEvent, newTime: string) {
    if (event.key === 'ArrowLeft') {
      this.viewerService.onJumpInAudio((+newTime - 5) * 1000);
    }
    if (event.key === 'ArrowRight') {
      this.viewerService.onJumpInAudio((+newTime + 5) * 1000);
    }
  }
}
