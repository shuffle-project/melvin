import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';
import { CaptionEntity } from '../../../../../services/api/entities/caption.entity';
import { ProjectEntity } from '../../../../../services/api/entities/project.entity';
import { TranscriptionEntity } from '../../../../../services/api/entities/transcription.entity';
import * as editorActions from '../../../../../store/actions/editor.actions';
import * as transcriptionsActions from '../../../../../store/actions/transcriptions.actions';
import { AppState } from '../../../../../store/app.state';
import * as captionsSelector from '../../../../../store/selectors/captions.selector';
import * as editorSelector from '../../../../../store/selectors/editor.selector';
import * as transcriptionsSelector from '../../../../../store/selectors/transcriptions.selector';
import * as viewerSelector from '../../../../../store/selectors/viewer.selector';
import { CaptionsSettingsDialogComponent } from '../captions-settings-dialog/captions-settings-dialog.component';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
})
export class PlayerComponent {
  @Input({ required: true }) project!: ProjectEntity | null;

  @ViewChild('viewerVideo') viewerVideo!: ElementRef;
  public videoPlayer: HTMLVideoElement | null = null;

  public videoLoaded = false;

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
  ]).pipe(
    map(([captions, backgroundColor, color, fontsize]) => {
      return { captions, backgroundColor, color, fontsize };
    })
  );

  constructor(private store: Store<AppState>, private dialog: MatDialog) {}

  // controls
  public volume: number = 1;
  public playbackSpeed: number = 1;

  // VIDEO

  onVideoLoadMetadata() {
    this.videoPlayer = this.viewerVideo.nativeElement;
    this.videoLoaded = true;
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
    // TODO funktioniert nicht

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

  // CONTROLS

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

  displayCurrentCaption(captions: CaptionEntity[]): string {
    if (this.videoPlayer && this.videoPlayer.currentTime) {
      const foundCaption = captions.find(
        (value) =>
          value.start / 1000 < this.videoPlayer!.currentTime &&
          value.end / 1000 > this.videoPlayer!.currentTime
      );

      if (foundCaption) {
        return foundCaption.text;
      }
    }
    return '';
  }
}
