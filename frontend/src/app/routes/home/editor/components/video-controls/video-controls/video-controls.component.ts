import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LetDirective, PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { DurationPipe } from 'src/app/pipes/duration-pipe/duration.pipe';
import { FeatureEnabledPipe } from 'src/app/pipes/feature-enabled-pipe/feature-enabled.pipe';
import * as editorActions from 'src/app/store/actions/editor.actions';
import { AppState } from 'src/app/store/app.state';
import * as editorSelectors from 'src/app/store/selectors/editor.selector';
import { MediaService } from '../../../service/media/media.service';

@Component({
  selector: 'app-video-controls',
  imports: [
    MatMenuModule,
    MatIconModule,
    PushPipe,
    MatButtonModule,
    MatSliderModule,
    MatTooltipModule,
    FeatureEnabledPipe,
    DurationPipe,
    LetDirective,
  ],
  templateUrl: './video-controls.component.html',
  styleUrl: './video-controls.component.scss',
})
export class VideoControlsComponent {
  public speedOptions: number[] = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  public currentSpeed$ = this.store.select(editorSelectors.selectCurrentSpeed);
  public volume$ = this.store.select(editorSelectors.selectVolume);
  public muted$ = this.store.select(editorSelectors.selectMuted);

  public isReady$ = this.mediaService.isReady$;
  public duration$ = this.mediaService.duration$;
  public isPlaying$ = this.store.select(editorSelectors.selectIsPlaying);
  public currentTime$ = this.mediaService.currentTime$;

  public sound$ = combineLatest({ volume: this.volume$, muted: this.muted$ });

  constructor(
    private store: Store<AppState>,
    private mediaService: MediaService
  ) {}

  onClickSetPlaybackSpeed(speed: number) {
    this.store.dispatch(editorActions.changeSpeedFromEditor({ speed }));
  }

  onSkipForward() {
    this.mediaService.skipForward(5000);
  }

  onSkipBackward() {
    this.mediaService.skipBackward(5000);
  }

  onTogglePlayPause() {
    this.store.dispatch(editorActions.togglePlayPauseFromEditor());

    // new
    this.store.dispatch(editorActions.ePlayPauseUser());
  }

  onClickBackToLive() {
    this.store.dispatch(editorActions.backToLive());
  }

  /** SOUND **/

  onVolumeChange(volumeChange: number, muted: boolean) {
    if (muted) {
      this.store.dispatch(editorActions.toggleMutedFromEditor());
    }
    this.store.dispatch(
      editorActions.changeVolumeFromVideoComponent({ volume: volumeChange })
    );
  }

  onMuteToggle() {
    this.store.dispatch(editorActions.toggleMutedFromEditor());
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

  sliderLabelVolume(value: number): string {
    return Math.round(value * 100) + '%';
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
