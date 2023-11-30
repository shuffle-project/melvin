import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, map, of, Subject, takeUntil } from 'rxjs';
import { CaptionEntity } from '../../../../../../../services/api/entities/caption.entity';
import { SpeakerEntity } from '../../../../../../../services/api/entities/transcription.entity';
import { AppState } from '../../../../../../../store/app.state';
import * as transcriptionsSelectors from '../../../../../../../store/selectors/transcriptions.selector';
import { EditSpeakerModalComponent } from './edit-speaker-modal/edit-speaker-modal.component';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-caption-speaker',
    templateUrl: './caption-speaker.component.html',
    styleUrls: ['./caption-speaker.component.scss'],
    standalone: true,
    imports: [
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    MatIconModule,
    EditSpeakerModalComponent
],
})
export class CaptionSpeakerComponent implements OnInit, OnDestroy, OnChanges {
  @Input() caption!: CaptionEntity;
  @Input() captionBefore!: CaptionEntity | null;
  @Input() isFocused!: boolean;

  private destroy$$ = new Subject<void>();
  private speakers!: SpeakerEntity[];

  public showSpeaker: boolean = true;
  public speaker!: SpeakerEntity | undefined;

  constructor(private store: Store<AppState>, private elementRef: ElementRef) {}

  ngOnInit(): void {
    combineLatest([
      this.store.select(transcriptionsSelectors.selectAvailableSpeakers),
      of(this.caption),
    ])
      .pipe(
        takeUntil(this.destroy$$),
        map(([speakers, caption]) => {
          this.speakers = speakers;
          this.speaker = speakers.find((o) => o.id === caption.speakerId);
        })
      )
      .subscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.showSpeaker =
      this.isFocused ||
      this.captionBefore?.speakerId !== this.caption?.speakerId;

    if (this.speakers) {
      this.speaker = this.speakers.find((o) => o.id === this.caption.speakerId);
    }
  }

  ngOnDestroy() {
    this.destroy$$.next();
  }
}
