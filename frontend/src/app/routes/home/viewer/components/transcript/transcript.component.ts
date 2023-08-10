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

@Component({
  selector: 'app-transcript',
  templateUrl: './transcript.component.html',
  styleUrls: ['./transcript.component.scss'],
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

  foundItemsIndex = 1;

  transcriptNew: CaptionEntity[][] = [];
  searchFoundInCaptionIds: string[] = [];
  searchTotalCount = 0;

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

  autoScroll: boolean = false;

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

          let searchTotalCountTemp = 0;
          let regex = new RegExp('(' + searchValue + ')', 'gi'); // g = global, i = case insensitive

          const searchFoundInCaptionIdsTemp: string[] = [];

          transcript.flat(1).filter((entity, i) => {
            const searchByValue = entity.text.match(regex);
            const foundXTimes = (searchByValue || []).length;
            (searchByValue || []).forEach(() =>
              searchFoundInCaptionIdsTemp.push(entity.id)
            );

            searchTotalCountTemp += foundXTimes;
            return searchByValue;
          });

          transcript.forEach((paragraph, indexParagraph) => {
            paragraph.forEach((entity, indexCaption) => {
              if (
                searchValue.length > 0 &&
                searchFoundInCaptionIdsTemp.includes(entity.id)
              ) {
                this.transcriptNew[indexParagraph][indexCaption].text =
                  entity.text.replace(regex, '<mark>$1</mark>');
              } else if (this.searchFoundInCaptionIds.includes(entity.id)) {
                this.transcriptNew[indexParagraph][indexCaption].text =
                  entity.text;
              }
            });
          });

          this.searchTotalCount = searchTotalCountTemp;
          this.searchFoundInCaptionIds = searchFoundInCaptionIdsTemp;

          if (searchValue.length > 0) {
            this.scrollToCaption(
              searchFoundInCaptionIdsTemp[this.foundItemsIndex - 1]
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
    this.foundItemsIndex = 1;
    this.searchValue$.next(event.target.value);
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
    if (this.foundItemsIndex < this.searchTotalCount) {
      this.foundItemsIndex++;
    } else {
      this.foundItemsIndex = 1;
    }
    this.scrollToCaption(
      this.searchFoundInCaptionIds[this.foundItemsIndex - 1]
    );
  }

  onGoToRecentFound() {
    if (this.foundItemsIndex > 1) {
      this.foundItemsIndex--;
    } else {
      this.foundItemsIndex = this.searchTotalCount;
    }
    this.scrollToCaption(
      this.searchFoundInCaptionIds[this.foundItemsIndex - 1]
    );
  }

  scrollToCaption(id: string) {
    document
      .getElementById('caption-' + id)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
}
