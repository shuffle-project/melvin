import { CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf } from '@angular/cdk/scrolling';
import { Component, OnDestroy, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  Subject,
  delay,
  filter,
  takeUntil,
  tap,
  throttleTime,
  withLatestFrom,
} from 'rxjs';
import { AppState } from 'src/app/store/app.state';
import { CaptionEntity } from '../../../../../services/api/entities/caption.entity';
import { SpeakerEntity } from '../../../../../services/api/entities/transcription.entity';
import * as authSelectors from '../../../../../store/selectors/auth.selector';
import * as captionsSelectors from '../../../../../store/selectors/captions.selector';
import { MediaService } from '../../services/media/media.service';
import { CaptionComponent } from './caption/caption.component';
import { NgIf, NgFor } from '@angular/common';
import { LetDirective } from '@ngrx/component';

@Component({
    selector: 'app-captions',
    templateUrl: './captions.component.html',
    styleUrls: ['./captions.component.scss'],
    standalone: true,
    imports: [
        LetDirective,
        NgIf,
        NgFor,
        CdkVirtualScrollViewport,
        CdkFixedSizeVirtualScroll,
        CdkVirtualForOf,
        CaptionComponent,
    ],
})
export class CaptionsComponent implements OnDestroy {
  @ViewChild('cdkVirtualScrollViewport')
  cdkVirtualScrollViewport!: CdkVirtualScrollViewport;

  private destroy$$ = new Subject<void>();

  public captions$ = this.store.select(captionsSelectors.selectCaptions);
  public captionsLoading$ = this.store.select(captionsSelectors.selectLoading);
  public userid$ = this.store.select(authSelectors.selectUserId);
  public userId: string | null = '';

  constructor(
    private store: Store<AppState>,
    private mediaService: MediaService
  ) {
    this.userid$.pipe(takeUntil(this.destroy$$)).subscribe((userId) => {
      this.userId = userId;
    });

    this.mediaService.jumpToCaptionTime$
      .pipe(
        takeUntil(this.destroy$$),
        filter((currentTime) => currentTime !== null),
        throttleTime(50),
        withLatestFrom(this.captions$),
        tap(([currentTime, captions]) => {
          let index = captions.findIndex(
            (caption) =>
              (currentTime as number) >= caption.start &&
              (currentTime as number) <= caption.end
          );
          if (
            index === -1 &&
            (currentTime as number) > captions[captions.length - 1].end
          ) {
            index = captions.length - 1;
          }
          this.scrollToIndex(index);
        })
      )
      .subscribe();

    // Jump to newest caption if none is selected
    this.mediaService.captionCreated$
      .pipe(
        takeUntil(this.destroy$$),
        throttleTime(50),
        withLatestFrom(this.captions$),
        filter(
          ([createdCaption, captions]) =>
            captions[captions.length - 1].id === createdCaption.id &&
            !captions.some((o) => o.lockedBy === this.userId)
        ),
        delay(100), // TODO: Fixed delay might be bad, but view has to update first to detect new offset
        tap(([createdCaption, captions]) => {
          this.scrollToIndex(captions.length - 1);
        })
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$$.next();
  }

  getSpeaker(speakerId: string, speakers: SpeakerEntity[]): string {
    let speakerItem = speakers.find((item) => item.id === speakerId);
    if (speakerItem != undefined) {
      return speakerItem['name'];
    }
    return speakerId;
  }

  trackById(index: number, caption: { id: string; speakerId: string }) {
    return caption.id;
  }

  isLockedByOthers(caption: CaptionEntity) {
    if (caption.lockedBy) {
      return caption.lockedBy === this.userId ? false : true;
    }
    return false;
  }

  scrollToIndex(index: number) {
    this.cdkVirtualScrollViewport.scrollToIndex(index);
  }
}
