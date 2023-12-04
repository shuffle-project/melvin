import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { Store } from '@ngrx/store';
import {
  BehaviorSubject,
  Observable,
  Subject,
  combineLatest,
  debounceTime,
  map,
  takeUntil,
  tap,
} from 'rxjs';
import { CaptionEntity } from '../../../../../services/api/entities/caption.entity';
import { SpeakerEntity } from '../../../../../services/api/entities/transcription.entity';
import { AppState } from '../../../../../store/app.state';
import * as captionsSelector from '../../../../../store/selectors/captions.selector';
import * as transcriptionsSelector from '../../../../../store/selectors/transcriptions.selector';
import * as viewerSelector from '../../../../../store/selectors/viewer.selector';
import { ViewerService } from '../../viewer.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LetDirective, PushPipe } from '@ngrx/component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgStyle } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
    selector: 'app-transcript',
    templateUrl: './transcript.component.html',
    styleUrls: ['./transcript.component.scss'],
    standalone: true,
    imports: [
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    LetDirective,
    NgStyle,
    MatCheckboxModule,
    PushPipe
],
})
export class TranscriptComponent implements OnDestroy, OnInit {
  private destroy$$ = new Subject<void>();

  // @ViewChild(CdkVirtualScrollViewport) viewPort!: CdkVirtualScrollViewport;
  @ViewChildren('.match') matches!: QueryList<HTMLElement>;

  captions$ = this.store.select(captionsSelector.selectCaptions);

  availableSpeakers$ = this.store.select(
    transcriptionsSelector.selectAvailableSpeakers
  );
  transcriptFontsize$ = this.store.select(
    viewerSelector.selectTranscriptFontsize
  );

  searchValue$: BehaviorSubject<string> = new BehaviorSubject('');
  searchValue: string = ''; // for ngModel

  foundItemsNumber = 1;

  transcriptNew: CaptionEntity[][] = [];
  searchFoundInCaptionIds: string[] = [];
  // searchFoundInCaptionId: string | null = null;

  transcript$: Observable<CaptionEntity[][]> = this.captions$.pipe(
    map((captions) => {
      if (captions.length === 0) return [];

      const finalTranscriptParagraphs: CaptionEntity[][] = [];

      let tempTranscriptParagraph: CaptionEntity[] = [captions[0]];
      let tempCurrentTextLength = captions[0].text.length;

      let captionIndex = 1; // start at second item, first item is already in temp
      while (captionIndex < captions.length) {
        const captionAtIndex = captions[captionIndex];
        const captionPreviousIndex = captions[captionIndex - 1];

        const speakerChange =
          captionPreviousIndex.speakerId !== captionAtIndex.speakerId;
        const tooLongAndSentenceFinished =
          tempCurrentTextLength > 400 &&
          (captionPreviousIndex.text.endsWith('.') ||
            captionPreviousIndex.text.endsWith('!') ||
            captionPreviousIndex.text.endsWith('?'));
        const wayTooLong = tempCurrentTextLength > 1000;

        if (speakerChange || tooLongAndSentenceFinished || wayTooLong) {
          // speaker change or sentence finished/caption too long -> new Paragraph
          finalTranscriptParagraphs.push(tempTranscriptParagraph);
          tempTranscriptParagraph = [captionAtIndex];
          tempCurrentTextLength = captionAtIndex.text.length;
        } else {
          tempTranscriptParagraph.push(captionAtIndex);
          tempCurrentTextLength += captionAtIndex.text.length;
        }

        captionIndex++;
      }

      this.transcriptNew = JSON.parse(
        JSON.stringify(finalTranscriptParagraphs)
      );
      return finalTranscriptParagraphs;
    })
  );

  autoScroll: boolean = true;

  constructor(
    public store: Store<AppState>,
    public viewerService: ViewerService,
    public changeRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    combineLatest([this.viewerService.currentCaption$, this.captions$])
      .pipe(
        takeUntil(this.destroy$$),
        // debounceTime(10),
        tap(([currentCaption, captions]) => {
          if (currentCaption && this.autoScroll) {
            const index = captions.findIndex(
              (caption) => caption.id === currentCaption.id
            );

            if (index) {
              this.scrollToCaption(currentCaption.id);
            }
          }
        })
      )
      .subscribe();

    combineLatest([this.transcript$, this.searchValue$])
      .pipe(
        takeUntil(this.destroy$$),
        debounceTime(250),
        tap(([transcript, searchValue]) => {
          // TODO
          // transcriptParagraphs als interface mit id's
          // jeder paragraph als component mit onPush
          // transcript nicht als obs

          let regex = new RegExp('(' + searchValue + ')', 'gi'); // g = global, i = case insensitive

          const searchFoundInCaptionIdsTemp: string[] = [];

          let markIndex = 0;

          transcript.forEach((paragraph, indexParagraph) => {
            paragraph.forEach((entity, indexCaption) => {
              const matches = entity.text.match(regex);
              if (searchValue.length > 0 && matches?.length) {
                // console.log(matches);
                searchFoundInCaptionIdsTemp.push(
                  ...matches.map(() => entity.id)
                );

                // this.transcriptNew[indexParagraph][indexCaption].text =
                //   entity.text.replace(regex, '<mark>$1</mark>');

                this.transcriptNew[indexParagraph][indexCaption].text =
                  entity.text.replace(
                    regex,
                    (text) => `<mark class="mark-${markIndex++}">${text}</mark>`
                  );
              } else {
                this.transcriptNew[indexParagraph][indexCaption].text =
                  entity.text;
              }
            });
          });

          this.searchFoundInCaptionIds = searchFoundInCaptionIdsTemp;

          if (searchValue.length > 0) {
            // this.searchFoundInCaptionId = null;
            // this.foundItemsNumber = 1;
            // this.scrollToMark(this.foundItemsNumber - 1);
            this.scrollToCaption(
              searchFoundInCaptionIdsTemp[this.foundItemsNumber - 1]
            );
          }
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$$.next();
  }

  onSearchChange(event: any) {
    this.foundItemsNumber = 1;
    // this.searchFoundInCaptionId = null;
    this.searchValue$.next(event.target.value);
  }

  onClearSearchInput() {
    this.searchValue = '';
    // this.searchFoundInCaptionId = null;
    this.searchValue$.next('');
  }

  onKeydownSearch(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        this.onGoToRecentFound();
      } else {
        this.onGoToNextFound();
      }
    }
  }

  onGoToNextFound() {
    if (this.foundItemsNumber < this.searchFoundInCaptionIds.length) {
      this.foundItemsNumber++;
    } else {
      this.foundItemsNumber = 1;
    }
    this.scrollToMark(this.foundItemsNumber - 1);
    // this.scrollToCaption(
    //   this.searchFoundInCaptionIds[this.foundItemsIndex - 1]
    // );
  }

  onGoToRecentFound() {
    if (this.foundItemsNumber > 1) {
      this.foundItemsNumber--;
    } else {
      this.foundItemsNumber = this.searchFoundInCaptionIds.length;
    }
    this.scrollToMark(this.foundItemsNumber - 1);
    // this.scrollToCaption(
    //   this.searchFoundInCaptionIds[this.foundItemsIndex - 1]
    // );
  }

  scrollToMark(index: number) {
    console.log('scroll to ');
    console.log(`mark-${index}`);
    const mark = document.getElementsByClassName(`mark-${index}`).item(0);
    if (mark) {
      // mark.
      // mark.classList.add('active-mark');
      // mark.setAttribute('style', 'color: red;');
      mark.scrollIntoView();
    }
  }

  scrollToCaption(id: string) {
    // this.searchFoundInCaptionId = id;
    document
      .getElementById('caption-' + id)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // TODO switch to block, but only scroll in inner div, not in out div
    // block: 'center'
  }

  getSpeakerName(speakerId: string, availableSpeakers: SpeakerEntity[]) {
    return availableSpeakers.find((speaker) => speaker.id === speakerId)?.name;
  }

  onJumpInVideo(caption: CaptionEntity) {
    this.viewerService.onJumpInAudio(caption.start + 1);
  }

  trackById(index: number, caption: { id: string; speakerId: string }) {
    return caption.id;
  }

  onScrollInViewport() {
    this.autoScroll = false;
  }
}
