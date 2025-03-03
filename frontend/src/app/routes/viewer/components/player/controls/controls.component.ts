import { A11yModule } from '@angular/cdk/a11y';
import { CdkMenuModule } from '@angular/cdk/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
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
import dayjs from 'dayjs';
import { combineLatest, map, Subject, takeUntil } from 'rxjs';
import { MediaCategoryPipe } from 'src/app/pipes/media-category-pipe/media-category.pipe';
import { WrittenOutLanguagePipe } from 'src/app/pipes/written-out-language-pipe/written-out-language.pipe';
import {
  ProjectMediaEntity,
  ResolutionValue,
} from 'src/app/services/api/entities/project.entity';
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
    CdkMenuModule,
    MenuItemRadioDirective,
    OverlayModule,
    A11yModule,
    WrittenOutLanguagePipe,
    MediaCategoryPipe,
  ],
  providers: [DurationPipe],
})
export class ControlsComponent implements OnInit, OnDestroy {
  @Input({ required: true }) media!: ProjectMediaEntity;

  public currentProgress$ = this.viewerService.currentTime$.pipe(
    map((time) => {
      return {
        progress: time,
        time: this.durationPipe.transform(time * 1000, 'mm:ss'),
        duration: this.durationPipe.transform(
          (this.viewerService.audio?.duration || 0) * 1000,
          'mm:ss'
        ),
      };
    })
  );

  public tanscriptPositionENUM = TranscriptPosition;
  public colorThemeENUM = ColorTheme;

  public volume$ = this.store.select(viewerSelector.vVolume);
  public muted$ = this.store.select(viewerSelector.vMuted);
  public sound$ = combineLatest({ volume: this.volume$, muted: this.muted$ });

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

  public project$ = this.store.select(viewerSelector.vProject);

  locale = $localize.locale;

  playLocalize = $localize`:@@viewerControlsPlayLabel:Play`;
  pauseLocalize = $localize`:@@viewerControlsPauseLabel:Pause`;
  muteLocalize = $localize`:@@viewerControlsMuteLabel:Mute`;
  unmuteLocalize = $localize`:@@viewerControlsUnmuteLabel:Unmute`;
  fullscreenLocalize = $localize`:@@viewerControlsFullscreenLabel:Fullscreen`;
  closeFullscreenLocalize = $localize`:@@viewerControlsCloseFullscreenLabel:Close fullscreen`;

  sortedResolutions: ResolutionValue[] = [];
  currentMaxResolution!: ResolutionValue;
  private destroy$$ = new Subject<void>();

  constructor(
    private store: Store<AppState>,
    public viewerService: ViewerService,
    private dialog: MatDialog,
    public overlayService: OverlayService,
    private durationPipe: DurationPipe
  ) {}

  ngOnInit(): void {
    const resolutionOptions = new Set<ResolutionValue>();

    this.media.videos.forEach((video) => {
      video.resolutions.forEach((resolution) => {
        resolutionOptions.add(resolution.resolution);
      });
    });

    this.sortedResolutions = Array.from(resolutionOptions).sort((a, b) =>
      +a.slice(0, -1) > +b.slice(0, -1) ? 1 : -1
    );

    this.store
      .select(viewerSelector.vMaxResolution)
      .pipe(takeUntil(this.destroy$$))
      .subscribe((maxResolution) => {
        if (this.sortedResolutions.find((r) => r === maxResolution)) {
          this.currentMaxResolution = maxResolution;
        } else {
          this.currentMaxResolution = this.sortedResolutions.at(-1)!;
        }
      });
  }

  changeMaxResolution(resolution: ResolutionValue) {
    if (resolution !== this.currentMaxResolution) {
      this.store.dispatch(
        viewerActions.changeMaxResolution({ newMaxResolution: resolution })
      );
    }
  }

  sliderLabelVolume(value: number): string {
    return Math.round(value * 100) + '%';
  }

  sliderProgressLabel(value: number): string {
    return dayjs.duration(value * 1000).format('mm:ss');
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
      viewerActions.changeTranscriptPositionControls({ transcriptPosition })
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
    const shownVideos = videos.filter((video) => video.shown);
    if (shownVideos.length === 1 && video.shown) {
      return;
    }

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

    if (volumeChange === 0) {
      this.store.dispatch(viewerActions.toggleMute());
    }
  }

  onMuteToggle(sound: { volume: number; muted: boolean }) {
    this.store.dispatch(viewerActions.toggleMute());

    if (sound.volume === 0) {
      this.store.dispatch(
        viewerActions.changeVolume({
          newVolume: 0.5,
        })
      );
    }
  }

  mouseOverSound = false;
  focusOnVolumeSlider = false;

  onMouseEnterBtn() {
    if (!this.mouseOverSound) this.mouseOverSound = true;
  }
  onMouseOutBtn() {
    if (this.mouseOverSound) this.mouseOverSound = false;
    if (this.focusOnVolumeSlider) this.focusOnVolumeSlider = false;
  }

  onFocusVolumeSlider() {
    if (!this.focusOnVolumeSlider) this.focusOnVolumeSlider = true;
  }

  onBlurVolumeSlider() {
    if (this.focusOnVolumeSlider) this.focusOnVolumeSlider = false;
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

  ngOnDestroy() {
    this.destroy$$.next();
  }
}
