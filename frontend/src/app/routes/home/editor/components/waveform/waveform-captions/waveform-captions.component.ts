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
import {
  combineLatest,
  filter,
  map,
  Observable,
  Subject,
  takeUntil,
} from 'rxjs';
import { CaptionEntity } from '../../../../../../services/api/entities/caption.entity';
import * as captionsActions from '../../../../../../store/actions/captions.actions';
import { AppState } from '../../../../../../store/app.state';
import * as captionsSelectors from '../../../../../../store/selectors/captions.selector';
import { MediaService } from '../../../services/media/media.service';
import { AppResizeEvent } from '../resize/resize.directive';
import { WaveformService } from '../waveform.service';

export interface ViewCaption {
  caption: CaptionEntity;
  left: number;
  width: number;
  isPlaying: boolean;
  isSelected: boolean;
}

@Component({
  selector: 'app-waveform-captions',
  templateUrl: './waveform-captions.component.html',
  styleUrls: ['./waveform-captions.component.scss'],
})
export class WaveformCaptionsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() hidden: boolean = false;

  private destroy$$ = new Subject<void>();
  private hiddenChanged$ = new Subject<void>();
  private changedCaptions: CaptionEntity[] = [];

  public displayedCaptions$!: Observable<ViewCaption[]>;

  public endOfCaptionBeforeView: number | null = null;
  public startOfCaptionAfterView: number | null = null;

  constructor(
    private hostElement: ElementRef,
    private mediaService: MediaService,
    private store: Store<AppState>,
    private waveformService: WaveformService
  ) {}

  ngOnInit() {
    this.displayedCaptions$ = combineLatest([
      this.store.select(captionsSelectors.selectCaptions),
      this.store.select(captionsSelectors.selectSelectedCaption),
      this.mediaService.currentTime$,
      this.mediaService.currentCaption$,
      this.waveformService.canvasSettingsChanged$,
      this.hiddenChanged$,
    ]).pipe(
      takeUntil(this.destroy$$),
      filter(() => !this.hidden),
      map(([captions, selectedCaption, currentTime, currentCaption]) => {
        const zoomedRangeInMilliseconds =
          this.waveformService.getZoomedRangeInSeconds() * 1000;
        const currentTimeInMilliseconds = currentTime;

        const start = currentTimeInMilliseconds - zoomedRangeInMilliseconds / 2;
        const end = currentTimeInMilliseconds + zoomedRangeInMilliseconds / 2;

        const pixelPerMillseconds =
          this.hostElement.nativeElement.clientWidth /
          zoomedRangeInMilliseconds;

        const captionsInView = captions
          .filter((caption) => this._isCaptionInRange(caption, start, end))
          .map((caption) =>
            this._transformCaptionToViewCaption(
              caption,
              start,
              pixelPerMillseconds,
              selectedCaption,
              currentCaption
            )
          );

        // calculate end of caption before view and start of caption after view, to block movements over this threshold
        const indexFirstCaptionInView = captions.findIndex(
          (cpt) => cpt.id === captionsInView[0].caption.id
        );
        const indexLastCaptionInView = captions.findIndex(
          (cpt) =>
            cpt.id === captionsInView[captionsInView.length - 1].caption.id
        );
        const captionBefore = captions[indexFirstCaptionInView - 1];
        const captionAfter = captions[indexLastCaptionInView + 1];
        this.endOfCaptionBeforeView = captionBefore?.end;
        this.startOfCaptionAfterView = captionAfter?.start;

        return captionsInView;
      })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['hidden']) {
      this.hiddenChanged$.next(changes['hidden'].currentValue);
    }
  }

  ngOnDestroy(): void {
    this.destroy$$.next();
  }

  _isCaptionInRange(caption: CaptionEntity, start: number, end: number) {
    if (caption.start > start && caption.start < end) {
      return true;
    } else if (caption.end > start && caption.end < end) {
      return true;
    }
    return false;
  }

  _transformCaptionToViewCaption(
    caption: CaptionEntity,
    start: number,
    pixelPerMillseconds: number,
    selectedCaption: CaptionEntity,
    currentCaption: CaptionEntity | undefined | null
  ) {
    const duration = caption.end - caption.start;
    const left = (caption.start - start) * pixelPerMillseconds;
    const width = pixelPerMillseconds * duration;
    return {
      caption,
      left,
      width,
      isPlaying: caption.id === currentCaption?.id,
      isSelected: selectedCaption?.id === caption.id,
    };
  }

  trackById(index: number, item: ViewCaption) {
    return item.caption.id;
  }

  onClickCaption(item: ViewCaption) {
    // TODO: If click should be enabled, resize has to stop event propagation
    // const caption = item.caption;

    // this.mediaService.seekToSeconds(caption.start / 1000);

    // if (!caption.lockedBy) {
    //   this.store.dispatch(
    //     captionsActions.selectFromEditor({ captionId: caption.id })
    //   );
    // }
    return;
  }

  /**
   * Calculate the moved milliseconds from the moved pxs
   */
  _pixelToMilliseconds(pixel: number): number {
    const rangeInMillseconds =
      this.waveformService.getZoomedRangeInSeconds() * 1000;
    const millisecondsPerPixel =
      rangeInMillseconds / this.hostElement.nativeElement.clientWidth;

    return Math.round(pixel * millisecondsPerPixel);
  }

  _updateSingleCaptionReducer(
    caption: CaptionEntity,
    start: number,
    end: number
  ) {
    // Update reducer
    this.store.dispatch(
      captionsActions.updateReducerOnly({
        id: caption.id,
        updateDto: { start, end },
      })
    );

    if (!this.changedCaptions.some((obj) => obj.id === caption.id)) {
      this.changedCaptions.push({ ...caption });
    }

    // Track caption id
    const changedCaption = this.changedCaptions.find(
      (o) => o.id === caption.id
    ) || { ...caption };
    changedCaption.start = start;
    changedCaption.end = end;
  }

  /**
   * Update caption reducer and store changed caption ids
   */
  _updateEffectedCaptionsReducer(
    caption: CaptionEntity,
    start: number,
    end: number,
    previousCaption: CaptionEntity | undefined,
    subsequentCaption: CaptionEntity | undefined
  ) {
    // Caption
    this._updateSingleCaptionReducer(caption, start, end);

    // Previous caption
    if (previousCaption && previousCaption.end > start) {
      this._updateSingleCaptionReducer(
        previousCaption,
        previousCaption.start,
        start
      );
    }

    // Subsequent caption
    if (subsequentCaption && subsequentCaption.start < end) {
      this._updateSingleCaptionReducer(
        subsequentCaption,
        end,
        subsequentCaption.end
      );
    }
  }

  /**
   * Calculate start of caption and trigger update in reducer
   */
  _updateCaptionStart(
    caption: CaptionEntity,
    millseconds: number,
    previousCaption: CaptionEntity | undefined
  ) {
    const start = caption.start + millseconds;

    // Caption must not start before 0
    if (start < 0) {
      return;
    }

    // Caption must not be smaller 1 second
    if (caption.end - start < 1000) {
      return;
    }

    // Previous caption must not be smaller 1 second
    if (previousCaption && start - previousCaption.start < 1000) {
      return;
    }

    // Update captions
    this._updateEffectedCaptionsReducer(
      caption,
      start,
      caption.end,
      previousCaption,
      undefined
    );
  }

  /**
   * Calculate end of caption and trigger update in reducer
   */
  _updateCaptionEnd(
    caption: CaptionEntity,
    milliseconds: number,
    subsequentCaption: CaptionEntity | undefined
  ) {
    const end = caption.end + milliseconds;

    //  Caption end must not be after video end
    if (end >= this.mediaService.duration$.getValue()) {
      return;
    }

    // Caption must not be smaller 1 second
    if (end - caption.start < 1000) {
      return;
    }

    // Subsequent caption must not be smaller 1 second
    if (subsequentCaption && subsequentCaption.end - end < 1000) {
      return;
    }

    // Update caption end
    this._updateEffectedCaptionsReducer(
      caption,
      caption.start,
      end,
      undefined,
      subsequentCaption
    );
  }

  /**
   * Calculate new range of caption and trigger update in reducer
   */
  _updateCaptionRange(
    caption: CaptionEntity,
    milliseconds: number,
    previousCaption: CaptionEntity | undefined,
    subsequentCaption: CaptionEntity | undefined
  ) {
    const start = caption.start + milliseconds;
    const end = caption.end + milliseconds;

    //  if there is a caption before, but not in view
    if (!previousCaption && this.endOfCaptionBeforeView) {
      // stop if the start of the caption is <= the end of the caption before
      if (start <= this.endOfCaptionBeforeView) return;
    }

    //  if there is a caption before, but not in view
    if (!subsequentCaption && this.startOfCaptionAfterView) {
      // stop if the end of the caption is >= the start of the caption after
      if (end >= this.startOfCaptionAfterView) return;
    }

    // Caption must not start before 0
    if (start < 0) {
      return;
    }

    //  Caption end must not be after video end
    if (end >= this.mediaService.duration$.getValue()) {
      return;
    }

    // Previous caption must not be smaller 1 second
    if (previousCaption && start - previousCaption.start < 1000) {
      return;
    }

    // Subsequent caption must not be smaller 1 second
    if (subsequentCaption && subsequentCaption.end - end < 1000) {
      return;
    }

    // Update caption start and end
    this._updateEffectedCaptionsReducer(
      caption,
      start,
      end,
      previousCaption,
      subsequentCaption
    );
  }

  /**
   * Handle resize caption event
   */
  onResizeCaption(
    event: AppResizeEvent,
    viewCaption: ViewCaption,
    previousCaption: ViewCaption | undefined,
    subsequentCaption: ViewCaption | undefined
  ) {
    const milliseconds = this._pixelToMilliseconds(event.delta);
    switch (event.type) {
      case 'start':
        this._updateCaptionStart(
          viewCaption.caption,
          milliseconds,
          previousCaption?.caption
        );
        break;
      case 'mid':
        this._updateCaptionRange(
          viewCaption.caption,
          milliseconds,
          previousCaption?.caption,
          subsequentCaption?.caption
        );
        break;
      case 'end':
        this._updateCaptionEnd(
          viewCaption.caption,
          milliseconds,
          subsequentCaption?.caption
        );
        break;
    }
  }

  /**
   * Handle end of resize caption process
   * Update caption(s) after a resize process ist fully done
   */
  onSubmitResizeCaption() {
    // Send start, end changes to backend
    for (const caption of this.changedCaptions) {
      this.store.dispatch(
        captionsActions.updateEffectOnly({
          id: caption.id,
          updateDto: { start: caption.start, end: caption.end },
        })
      );
    }

    // Reset changed captions
    this.changedCaptions = [];
  }
}
