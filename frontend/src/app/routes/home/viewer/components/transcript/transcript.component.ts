import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  map,
  takeUntil,
  tap,
} from 'rxjs';
import { CaptionEntity } from '../../../../../services/api/entities/caption.entity';
import { AppState } from '../../../../../store/app.state';
import * as captionsSelector from '../../../../../store/selectors/captions.selector';
import * as viewerSelector from '../../../../../store/selectors/viewer.selector';
import { ViewerService } from '../../viewer.service';

@Component({
  selector: 'app-transcript',
  templateUrl: './transcript.component.html',
  styleUrls: ['./transcript.component.scss'],
})
export class TranscriptComponent implements OnDestroy, OnInit {
  private destroy$$ = new Subject<void>();

  @ViewChild(CdkVirtualScrollViewport) viewPort!: CdkVirtualScrollViewport;

  captions$ = this.store.select(captionsSelector.selectCaptions);
  transcriptFontsize$ = this.store.select(
    viewerSelector.selectTranscriptFontsize
  );

  searchValue: string = '';
  searchValue$: BehaviorSubject<string> = new BehaviorSubject('');

  foundItemsIndex = 1;

  searchFiltered$ = combineLatest([this.captions$, this.searchValue$]).pipe(
    map(([captions, searchValue]) => {
      let totalCount = 0;
      let regex = new RegExp('(' + searchValue + ')', 'gi'); // g = global, i = case insensitive

      const foundInCaption: number[] = [];

      let filteredBySearch = captions.filter((entity, i) => {
        const searchByValue = entity.text.match(regex);
        const foundXTimes = (searchByValue || []).length;
        (searchByValue || []).forEach(() => foundInCaption.push(i));

        totalCount += foundXTimes;
        return searchByValue;
      });
      if (searchValue.length > 0) {
        filteredBySearch = captions.map((value) => ({
          ...value,
          text: value.text.replace(regex, '<mark>$1</mark>'),
          counts: 0,
        }));
      }

      if (searchValue.length > 0) {
        this.scrollToIndex(foundInCaption[this.foundItemsIndex - 1]);
      }

      return {
        captions: filteredBySearch,
        totalCount,
        foundInCaption,
      };
    })
  );

  autoScroll: boolean = false;

  constructor(
    public store: Store<AppState>,
    public viewerService: ViewerService
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
              this.scrollToIndex(index);
            }
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

  onGoToNextFound(totalFounds: number, foundInCaptionIndex: number[]) {
    if (this.foundItemsIndex < totalFounds) {
      this.foundItemsIndex++;
    } else {
      this.foundItemsIndex = 1;
    }

    this.scrollToIndex(foundInCaptionIndex[this.foundItemsIndex - 1]);
  }

  onGoToRecentFound(totalFounds: number, foundInCaptionIndex: number[]) {
    if (this.foundItemsIndex > 1) {
      this.foundItemsIndex--;
    } else {
      this.foundItemsIndex = totalFounds;
    }
    this.scrollToIndex(foundInCaptionIndex[this.foundItemsIndex - 1]);
  }

  scrollToIndex(index: number) {
    this.viewPort.scrollToIndex(index, 'smooth');
  }

  onJumpInVideo(caption: CaptionEntity) {
    this.viewerService.onJumpInAudio(caption.start + 1);
  }
}
