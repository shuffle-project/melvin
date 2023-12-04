import { Component, Input, OnChanges } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import dayjs from 'dayjs';
import { DurationPipe } from '../../../../../../../pipes/duration-pipe/duration.pipe';
import { AlertService } from '../../../../../../../services/alert/alert.service';
import { CaptionEntity } from '../../../../../../../services/api/entities/caption.entity';
import * as captionsActions from '../../../../../../../store/actions/captions.actions';
import { AppState } from '../../../../../../../store/app.state';
import { FeatureEnabledPipe } from '../../../../../../../pipes/feature-enabled-pipe/feature-enabled.pipe';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { NgClass } from '@angular/common';

interface CaptionTimeFormGroup {
  start: AbstractControl<string>;
  end: AbstractControl<string>;
}

@Component({
    selector: 'app-caption-time',
    templateUrl: './caption-time.component.html',
    styleUrls: ['./caption-time.component.scss'],
    standalone: true,
    imports: [
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
    ReactiveFormsModule,
    NgClass,
    FeatureEnabledPipe
],
})
export class CaptionTimeComponent implements OnChanges {
  @Input() caption!: CaptionEntity;
  @Input() isFocused!: boolean;
  @Input() captionBefore!: CaptionEntity | null;
  @Input() captionAfter!: CaptionEntity | null;

  public formGroup: FormGroup<CaptionTimeFormGroup> =
    this.fb.group<CaptionTimeFormGroup>({
      start: this.fb.control('', { nonNullable: true }),
      end: this.fb.control('', { nonNullable: true }),
    });

  public captionInsertButtonDisabled = false;
  public captionInsertButtonTooltipText!: string;

  public inputStartClassName?: 'error' | 'saved';
  public inputEndClassName?: 'error' | 'saved';

  constructor(
    private fb: FormBuilder,
    private durationPipe: DurationPipe,
    private store: Store<AppState>,
    private alertService: AlertService
  ) {}

  ngOnChanges(): void {
    this._setFormControlValues(this.caption.start, this.caption.end);
  }

  _setFormControlValues(start: number, end: number) {
    this.formGroup.get('start')?.setValue(this.durationPipe.transform(start));
    this.formGroup.get('end')?.setValue(this.durationPipe.transform(end));

    this.captionInsertButtonDisabled =
      (this.caption.end - this.caption.start) / 2 <= 2000;

    this.captionInsertButtonTooltipText = this.captionInsertButtonDisabled
      ? $localize`:@@captionAddCaptionNotEnoughTime:Current caption does not provide enough time to provide half the time for a new caption`
      : $localize`:@@captionAddCaptionEnoughTime:Add caption`;
  }

  _animateInputElement(element: 'start' | 'end', className: 'saved' | 'error') {
    if (element === 'start') {
      this.inputStartClassName = className;
      setTimeout(() => (this.inputStartClassName = undefined), 1000);
    } else {
      this.inputEndClassName = className;
      setTimeout(() => (this.inputEndClassName = undefined), 1000);
    }
  }

  _resetFormControlValues() {
    this._setFormControlValues(this.caption.start, this.caption.end);
  }

  _getDurationFromDateString(
    value: string | undefined,
    milliseconds: number
  ): number {
    let duration = Number.NaN;

    if (value?.match(/^\d+:\d+:\d+$/)) {
      const [hours, minutes, seconds] = value
        .split(':')
        .map((o) => parseInt(o));
      duration = dayjs
        .duration({ seconds, minutes, hours, milliseconds })
        .as('milliseconds');
    } else if (value?.match(/^\d+:\d+$/)) {
      const [minutes, seconds] = value.split(':').map((o) => parseInt(o));
      duration = dayjs
        .duration({ seconds, minutes, milliseconds })
        .as('milliseconds');
    } else {
      throw new Error('Invalid string format');
    }

    if (Number.isNaN(duration)) {
      throw new Error('Error calculating duration with dajys');
    }

    return duration;
  }

  async onBlur(element: 'start' | 'end') {
    // Parse timestamp strings
    let start: number;
    let end: number;

    try {
      start = this._getDurationFromDateString(
        this.formGroup.value.start,
        this.caption.start % 1000
      );
      end = this._getDurationFromDateString(
        this.formGroup.value.end,
        this.caption.end % 1000
      );
    } catch (err) {
      this.alertService.error(
        $localize`:@@captionCaptionStartTimingFormatError:The time must be specified in the valid format HH:mm:ss.`
      );
      this._resetFormControlValues();
      this._animateInputElement(element, 'error');
      return;
    }

    // Duration has not changed
    if (start === this.caption.start && end === this.caption.end) {
      return;
    }

    // Start must be after end
    if (start > end) {
      this.alertService.error(
        $localize`:@@captionCaptionEndBeforeStartError:The caption end time can't be before the start time.`
      );
      this._resetFormControlValues();
      this._animateInputElement(element, 'error');
      return;
    }

    // Validate time ranges of previous and next caption
    const minStart = this.captionBefore?.end ?? -1;
    const maxEnd = this.captionAfter?.start ?? Number.POSITIVE_INFINITY;

    if (start < minStart) {
      this.alertService.error(
        $localize`:@@captionCaptionStartOverlapsPreviousCaptionError:The start time of the caption overlaps with the previous caption.`
      );
      this._resetFormControlValues();
      this._animateInputElement(element, 'error');
      return;
    }
    if (end > maxEnd) {
      this.alertService.error(
        $localize`:@@captionCaptionOverlapsFollowingError:The caption end time overlaps with the following caption.`
      );
      this._resetFormControlValues();
      this._animateInputElement(element, 'error');
      return;
    }

    // Save changes
    this.store.dispatch(
      captionsActions.update({
        id: this.caption.id,
        updateDto: {
          start,
          end,
        },
      })
    );

    // Update form controls
    this._setFormControlValues(start, end);
    this._animateInputElement(element, 'saved');
  }

  _insertCaption(
    start: number,
    end: number,
    insertStart: number,
    insertEnd: number
  ) {
    this.store.dispatch(
      captionsActions.update({
        id: this.caption.id,
        updateDto: {
          start,
          end,
        },
      })
    );

    this.store.dispatch(
      captionsActions.create({
        captionDto: {
          text: '',
          transcription: this.caption.transcription,
          start: insertStart,
          end: insertEnd,
          speakerId: this.caption.speakerId,
        },
      })
    );
  }

  onCaptionInsertBefore() {
    const duration = this.caption.end - this.caption.start;

    const start = Math.floor(this.caption.end - duration / 2);
    const end = this.caption.end;
    const insertStart = this.caption.start;
    const insertEnd = start - 1;

    this._insertCaption(start, end, insertStart, insertEnd);
  }

  onCaptionInsertAfter() {
    const duration = this.caption.end - this.caption.start;

    const start = this.caption.start;
    const end = Math.floor(this.caption.start + duration / 2) - 1;
    const insertStart = end + 1;
    const insertEnd = this.caption.end;

    this._insertCaption(start, end, insertStart, insertEnd);
  }
}
