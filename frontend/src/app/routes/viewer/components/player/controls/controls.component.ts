import { A11yModule } from '@angular/cdk/a11y';
import { CdkMenuModule } from '@angular/cdk/menu';
import { ConnectionPositionPair, OverlayModule } from '@angular/cdk/overlay';
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
import * as configActions from '../../../../../store/actions/config.actions';
import * as viewerActions from '../../../../../store/actions/viewer.actions';
import { AppState } from '../../../../../store/app.state';
import { ColorTheme } from '../../../../../store/reducers/config.reducer';
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
    A11yModule,
    AsyncPipe,
  ],
})
export class ControlsComponent {
  public tanscriptPositionENUM = TranscriptPosition;
  public colorThemeENUM = ColorTheme;

  public volume$ = this.store.select(viewerSelector.vVolume);
  public muted$ = this.store.select(viewerSelector.vMuted);
  public currentSpeed$ = this.store.select(viewerSelector.vCurrentSpeed);
  public colorTheme$ = this.store.select(configSelector.colorTheme);
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

  public isPlayingUser$ = this.store.select(viewerSelector.vIsPlayingUser);

  locale = $localize.locale;

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

  onSwitchLanguage(newLocale: string) {
    if (this.locale) {
      const newHref = document.location.href.replace(this.locale, newLocale);
      document.location.href = newHref;
    }
  }

  onPlayPauseVideo() {
    this.store.dispatch(viewerActions.playPauseUser());
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

  onChangeTranscription(transcription: TranscriptionEntity) {
    this.store.dispatch(
      viewerActions.changeTranscriptionId({ transcriptionId: transcription.id })
    );
  }

  onOpenCaptionsSettingsDialog() {
    this.viewerService.audio?.pause();

    const dialogRef = this.dialog.open(CaptionsSettingsDialogComponent);

    dialogRef.afterClosed().subscribe(() => {
      this._restoreFocusById('language-menu-button');
    });
  }

  onOpenTranscriptSettingsDialog() {
    this.viewerService.audio?.pause();

    const dialogRef = this.dialog.open(AdjustLayoutDialogComponent);
    dialogRef.afterClosed().subscribe(() => {
      this._restoreFocusById('language-menu-button');
    });
  }

  onOpenHelpDialog() {
    this.viewerService.audio?.pause();

    const dialogRef = this.dialog.open(HelpDialogComponent);
    dialogRef.afterClosed().subscribe(() => {
      this._restoreFocusById('settings-menu-button');
    });
  }

  private _restoreFocusById(id: string) {
    const btn = document.getElementById(id);
    if (btn) btn.focus();
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

  onChangeColorTheme(colorTheme: ColorTheme) {
    this.store.dispatch(configActions.changeColorThemeViewer({ colorTheme }));
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

  /**

   * SOUND
   */

  onVolumeChange(volumeChange: number, muted: boolean) {
    if (muted) {
      this.store.dispatch(viewerActions.toggleMute());
    }
    this.store.dispatch(
      viewerActions.changeVolume({
        newVolume: volumeChange,
      })
    );
  }

  onMuteToggle() {
    this.store.dispatch(viewerActions.toggleMute());
  }

  volumeOverlayPositions: ConnectionPositionPair[] = [
    {
      offsetX: 8,
      originX: 'end',
      originY: 'center',
      overlayX: 'start',
      overlayY: 'center',
    },
    {
      offsetX: -8,
      originX: 'start',
      originY: 'center',
      overlayX: 'end',
      overlayY: 'center',
    },
  ];

  mouseOverBtn = false;
  mouseOverOvly = false;

  isVolumeSliderOpen = false;
  onCloseVolumeOverlay() {
    setTimeout(() => {
      if (!this.mouseOverBtn && !this.mouseOverOvly) {
        this.isVolumeSliderOpen = false;
      }
    }, 250);
  }

  onOpenVolumeOverlay() {
    this.isVolumeSliderOpen = true;
  }

  onMouseEnterBtn() {
    this.isVolumeSliderOpen = true;
    this.mouseOverBtn = true;
    this.onOpenVolumeOverlay();
  }
  onMouseOutBtn() {
    this.mouseOverBtn = false;
    this.onCloseVolumeOverlay();
  }
  onMouseEnterOvly() {
    this.mouseOverOvly = true;
  }
  onMouseOutOvly() {
    this.mouseOverOvly = false;
    this.onCloseVolumeOverlay();
  }

  onKeydownVolumeBtn(
    event: KeyboardEvent,
    currentVolume: number,
    currentMuted: boolean
  ) {
    switch (event.key) {
      case 'ArrowUp':
        if (currentVolume < 1) {
          const newVolume = currentVolume + 0.1;
          this.onVolumeChange(newVolume > 1 ? 1 : newVolume, currentMuted);
        }
        break;
      case 'ArrowDown':
        if (currentVolume > 0) {
          const newVolume = currentVolume - 0.1;
          this.onVolumeChange(newVolume < 0 ? 0 : newVolume, currentMuted);
        }
        break;

      default:
        break;
    }
  }
}
