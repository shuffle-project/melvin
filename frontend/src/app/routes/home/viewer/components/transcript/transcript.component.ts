import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Component, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { AppState } from '../../../../../store/app.state';
import * as captionsSelector from '../../../../../store/selectors/captions.selector';

@Component({
  selector: 'app-transcript',
  templateUrl: './transcript.component.html',
  styleUrls: ['./transcript.component.scss'],
})
export class TranscriptComponent {
  @ViewChild(CdkVirtualScrollViewport) viewPort!: CdkVirtualScrollViewport;

  captions$ = this.store.select(captionsSelector.selectCaptions);

  searchValue: string = '';
  searchValue$: BehaviorSubject<string> = new BehaviorSubject('');

  foundItemsIndex = 1;

  searchFiltered$ = combineLatest([this.captions$, this.searchValue$]).pipe(
    map(([captions, searchValue]) => {
      let totalCount = 0;
      let regex = new RegExp(searchValue, 'gi');

      const foundInCaption: number[] = [];

      let filteredBySearch = captions.filter((entity, i) => {
        const searchByValue = entity.text.match(regex);
        const foundXTimes = (searchByValue || []).length;
        (searchByValue || []).forEach(() => foundInCaption.push(i));

        totalCount += foundXTimes;
        return searchByValue;
      });

      filteredBySearch = captions.map((value) => ({
        ...value,
        text: value.text.replace(regex, '<mark>' + searchValue + '</mark>'),
        counts: 0,
      }));

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

  autoScroll: boolean = true;
  constructor(public store: Store<AppState>) {}

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
    this.viewPort.scrollToIndex(index);
  }
}
