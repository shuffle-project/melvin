import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { AbstractControl, FormControl, ValidationErrors, ValidatorFn, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import {
  Observable,
  Subject,
  map,
  take,
  takeUntil,
  tap,
  throttleTime,
} from 'rxjs';
import { EDITOR_USER_UNKNOWN } from '../../../../../../../constants/editor.constants';
import { EditorUser } from '../../../../../../../interfaces/editor-user.interface';
import { CaptionEntity } from '../../../../../../../services/api/entities/caption.entity';
import * as captionsActions from '../../../../../../../store/actions/captions.actions';
import * as editorActions from '../../../../../../../store/actions/editor.actions';
import { AppState } from '../../../../../../../store/app.state';
import * as authSelectors from '../../../../../../../store/selectors/auth.selector';
import * as editorSelectors from '../../../../../../../store/selectors/editor.selector';
import { MediaService } from '../../../../services/media/media.service';
import {
  CaptionDeleteConfirmModalComponent,
  CaptionDeleteConfirmModalResult,
} from '../caption-actions/caption-delete-confirm-modal/caption-delete-confirm-modal.component';
import { FeatureEnabledPipe } from '../../../../../../../pipes/feature-enabled-pipe/feature-enabled.pipe';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LetDirective } from '@ngrx/component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-caption-text',
    templateUrl: './caption-text.component.html',
    styleUrls: ['./caption-text.component.scss'],
    standalone: true,
    imports: [
        NgIf,
        MatButtonModule,
        MatTooltipModule,
        MatIconModule,
        ReactiveFormsModule,
        MatProgressSpinnerModule,
        LetDirective,
        MatProgressBarModule,
        FeatureEnabledPipe,
    ],
})
export class CaptionTextComponent
  implements OnInit, AfterViewInit, OnChanges, OnDestroy
{
  @Input() caption!: CaptionEntity;
  @Input() captionBefore!: CaptionEntity | null;
  @Input() captionAfter!: CaptionEntity | null;
  @Input() isFocused: boolean = false;

  private destroy$$ = new Subject<void>();
  private blur$ = new Subject<void>();
  private userId!: string | null;
  private editorUsers!: EditorUser[];
  private observer = new IntersectionObserver(
    this._onIntersectionObserverChange.bind(this)
  );

  public isSelected: boolean = false;
  public isNew: boolean = false;
  public lockedBy!: { name: string; color: string } | null;
  public progress$!: Observable<{ show: boolean; value: number }>;
  public formControl = new FormControl<string>('');
  public showSaveSpinner = false;

  public markedForDeletion: boolean = false;

  get isTextModified(): boolean {
    return this.caption.text !== this.formControl.value;
  }

  get errorMessage(): string | null {
    if (this.formControl.valid) {
      return null;
    }

    if (this.formControl.hasError('maximumNumberOfCharacters')) {
      return `too many characters (${this.formControl.value?.length} / 84)`;
    }

    if (this.formControl.hasError('maximumCharactersPerSecond')) {
      return `more than 20 characters per second`;
    }

    if (this.formControl.hasError('maximumNumberOfLines')) {
      return 'more than 2 lines';
    }

    if (this.formControl.hasError('maximumNumberOfCharactersPerLine')) {
      return `too many characters in one line (${
        this.formControl.value
          ?.split('\n')
          .map((o) => o.length)
          .sort((a, b) => b - a)[0]
      } / 42)`;
    }

    if (this.formControl.hasError('keepLinesToMinimum')) {
      return 'unnecessary second line';
    }

    return null;
  }

  constructor(
    private elementRef: ElementRef,
    private mediaService: MediaService,
    private store: Store<AppState>,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.progress$ = this.mediaService.currentTime$.pipe(
      takeUntil(this.destroy$$),
      map((currentTime) => {
        const start = currentTime - this.caption.start;
        const duration = this.caption.end - this.caption.start;
        const value = (start / duration) * 100;

        return { show: value >= 0 && value <= 100, value };
      })
    );

    this.store
      .select(authSelectors.selectUserId)
      .pipe(
        takeUntil(this.destroy$$),
        map((userId) => (this.userId = userId))
      )
      .subscribe();

    this.store
      .select(editorSelectors.selectActiveUsers)
      .pipe(
        takeUntil(this.destroy$$),
        map((activeUsers) => (this.editorUsers = activeUsers))
      )
      .subscribe();

    this.blur$
      .pipe(takeUntil(this.destroy$$), throttleTime(50))
      .subscribe(() => this._eventuallyUnlockCaption());

    // Text validation
    this.store
      .select(editorSelectors.selectCaptionTextValidationEnabled)
      .pipe(
        takeUntil(this.destroy$$),
        tap((isCaptionTextValidationEnabled) => {
          this.formControl.clearValidators();
          if (isCaptionTextValidationEnabled) {
            this.formControl.addValidators([
              Validators.required,
              this._captionTextValidator(),
            ]);
          }
          this.formControl.updateValueAndValidity();
        })
      )
      .subscribe();
  }

  ngAfterViewInit(): void {
    this.observer.observe(this.elementRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer.disconnect();
    this.destroy$$.next();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['caption']) {
      this.formControl.setValue(this.caption?.text);

      this.isNew = this.caption?.createdAt === this.caption?.updatedAt;

      if (this.caption.lockedBy && this.caption.lockedBy !== this.userId) {
        const user =
          this.editorUsers?.find((o) => o.id === this.caption.lockedBy) ||
          EDITOR_USER_UNKNOWN;
        this.lockedBy = { name: user.name, color: user.color };
      } else {
        this.lockedBy = null;
      }
    }
  }

  _onIntersectionObserverChange(entries: IntersectionObserverEntry[]) {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || entry.intersectionRatio <= 0) {
        this.blur$.next();
      }
    });
  }

  _eventuallyUnlockCaption() {
    this.isSelected = false;

    this.store.dispatch(captionsActions.unselectFromCaption());

    if (this.caption.lockedBy === this.userId) {
      const text = this.isTextModified
        ? (this.formControl.value as string)
        : undefined;

      if (text) {
        this.showSaveSpinner = true;
        setTimeout(() => (this.showSaveSpinner = false), 1000);
      }

      if (this.markedForDeletion) {
        // caption was already deleted
        return;
      }
      this.store.dispatch(
        captionsActions.update({
          id: this.caption.id,
          updateDto: { lockedBy: null, text },
        })
      );
    }
  }

  /**
   * Netflix rules: https://partnerhelp.netflixstudios.com/hc/en-us/articles/217350977-English-Timed-Text-Style-Guide
   */
  _captionTextValidator(): ValidatorFn {
    return (control: AbstractControl<string>): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      // Maximum of 84 characters
      if (value.length > 84) {
        return { maximumNumberOfCharacters: true };
      }

      // 20 characters per second
      const duration = (this.caption.end - this.caption.start) / 1000;
      if (value.length / duration > 20) {
        return { maximumCharactersPerSecond: true };
      }

      // Maximum of two lines
      const lines = value.split('\n');
      if (lines.length > 2) {
        return { maximumNumberOfLines: true };
      }

      // 42 characters per line
      if (lines.some((o) => o.length > 42)) {
        return { maximumNumberOfCharactersPerLine: true };
      }

      // Use minimum number of lines
      if (lines.length === 2 && value.length <= 42) {
        return { keepLinesToMinimum: true };
      }

      return null;
    };
  }

  onFocus() {
    // Caption is locked by other user
    if (this.caption.lockedBy) {
      return;
    }

    this.isSelected = true;

    this.store.dispatch(
      captionsActions.update({
        id: this.caption.id,
        updateDto: { lockedBy: this.userId },
      })
    );

    this.store.dispatch(
      captionsActions.selectFromCaption({ captionId: this.caption.id })
    );
  }

  onBlur() {
    this.blur$.next();
  }

  onClickPlayFromStart() {
    this.mediaService.seekToTime(this.caption.start, false);
    this.store.dispatch(editorActions.playFromCaption());
  }

  onClickLoop() {
    this.mediaService.loop(this.caption.start, this.caption.end);
  }

  onClickUndo() {
    console.log('undo');
    this.formControl.setValue(this.caption.text);
  }

  onKeyDownTextarea(event: KeyboardEvent) {
    // TODO aufräumen
    if (!this.formControl.value) {
      return;
    }
    const keycode = event.key || event.code;
    const target = event.target!;
    const cursorPosition = (target as any)?.selectionStart;

    switch (keycode) {
      case 'Enter':
        if (event.ctrlKey) {
          // insert new line on STRG + Enter
          if (this.formControl.value) {
            this.formControl.setValue(
              this.formControl.value.slice(0, cursorPosition) +
                '\n' +
                this.formControl.value.slice(cursorPosition)
            );
          }
        } else {
          // move text from cursor to next/new caption
          const beforeCursor = this.formControl.value.slice(0, cursorPosition);
          const afterCursor = this.formControl.value.slice(cursorPosition);
          const timeCurrent = this.caption.end - this.caption.start;

          event.preventDefault();
          if (this.captionAfter) {
            // if the caption time is over 6 seconds, it will split the caption in 2 captions
            // otherwise it will move the text to the next caption
            const insertInNewCaption =
              timeCurrent > 6000 || event.shiftKey ? true : false;

            if (insertInNewCaption) {
              this.movePartToNewCaption(beforeCursor, afterCursor, timeCurrent);
            } else {
              this.movePartToNextCaption(beforeCursor, afterCursor);
            }
          } else {
            // Its the last caption, so move the text to a new caption
            this.movePartToNewCaption(beforeCursor, afterCursor, timeCurrent);
          }
        }
        break;
      case 'Backspace':
        if (cursorPosition === 0) {
          // if the cursor is at the first char, delete current caption
          // the text will be moved to the captionBefore
          event.preventDefault();
          this.deleteCurrentCaptionAndMoveText();
        }
        break;

      default:
        break;
    }
  }

  movePartToNewCaption(
    firstPart: string,
    lastPart: string,
    timeCurrent: number
  ) {
    const createCaptionDto = {
      speakerId: this.caption.speakerId,
      text: lastPart,
      transcription: this.caption.transcription,
      start: this.caption.start + Math.floor(timeCurrent / 2),
      end: this.caption.end,
    };

    const updateCaptionDto = {
      text: firstPart,
      end: this.caption.start + Math.floor(timeCurrent / 2),
    };

    this.store.dispatch(
      captionsActions.update({
        id: this.caption.id,
        updateDto: updateCaptionDto,
      })
    );
    this.store.dispatch(
      captionsActions.create({
        captionDto: createCaptionDto,
      })
    );
  }

  movePartToNextCaption(firstPart: string, lastPart: string) {
    if (this.captionAfter) {
      this.store.dispatch(
        captionsActions.update({
          id: this.caption.id,
          updateDto: { text: firstPart },
        })
      );
      this.store.dispatch(
        captionsActions.update({
          id: this.captionAfter.id,
          updateDto: { text: lastPart + ' ' + this.captionAfter.text },
        })
      );
    }
  }

  deleteCurrentCaptionAndMoveText() {
    if (this.captionBefore) {
      // if there ist a caption before, move the text to this and delete the caption
      this.store.dispatch(
        captionsActions.update({
          id: this.captionBefore.id,
          updateDto: {
            text: this.captionBefore.text + ' ' + this.caption.text,
            end: this.caption.end,
          },
        })
      );

      this.store.dispatch(
        captionsActions.remove({ removeCaptionId: this.caption.id })
      );
      this.markedForDeletion = true;
    } else {
      // delete caption
      const dialogRef = this.dialog.open(CaptionDeleteConfirmModalComponent, {
        data: { caption: this.caption },
      });

      dialogRef
        .afterClosed()
        .pipe(take(1))
        .subscribe((data: CaptionDeleteConfirmModalResult) => {
          if (data?.delete) {
            this.store.dispatch(
              captionsActions.remove({ removeCaptionId: this.caption.id })
            );
            this.markedForDeletion = true;
          }
        });
    }
  }
}
