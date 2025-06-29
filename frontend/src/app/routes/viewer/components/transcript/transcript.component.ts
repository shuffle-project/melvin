import { NgStyle } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { LetDirective, PushPipe } from '@ngrx/component';
import { Store } from '@ngrx/store';
import {
  BehaviorSubject,
  Observable,
  Subject,
  combineLatest,
  firstValueFrom,
  map,
  takeUntil,
  tap,
  throttleTime,
} from 'rxjs';
import { selectQueryParams } from 'src/app/store/selectors/router.selectors';
import { UserScrollDirective } from '../../../../directives/userScroll/user-scroll.directive';
import { TiptapCaption } from '../../../../services/api/entities/caption.entity';
import { SpeakerEntity } from '../../../../services/api/entities/transcription.entity';
import { AppState } from '../../../../store/app.state';
import * as viewerSelector from '../../../../store/selectors/viewer.selector';
import { ViewerService } from '../../services/viewer.service';
import { generateTranscript } from './transcript.utils';

@Component({
  selector: 'app-transcript',
  templateUrl: './transcript.component.html',
  styleUrls: ['./transcript.component.scss'],
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
    PushPipe,
    UserScrollDirective,
  ],
})
export class TranscriptComponent implements OnDestroy, OnInit {
  private destroy$$ = new Subject<void>();

  debugMode = false;

  // @ViewChild(CdkVirtualScrollViewport) viewPort!: CdkVirtualScrollViewport;
  @ViewChildren('.match') matches!: QueryList<HTMLElement>;

  project$ = this.store.select(viewerSelector.vProject);

  captions$ = this.store.select(viewerSelector.vCaptions);

  availableSpeakers$ = this.store.select(viewerSelector.vAvailableSpeakers);
  transcriptFontsize$ = this.store.select(viewerSelector.vTranscriptFontsize);

  searchValue$: BehaviorSubject<string> = new BehaviorSubject('');
  searchValue: string = ''; // for ngModel

  foundItemsNumber = 1;

  transcriptNew: TiptapCaption[][] = [];
  searchFoundInCaptionIds: string[] = [];
  // searchFoundInCaptionId: string | null = null;

  autoScroll = true;

  constructor(
    public store: Store<AppState>,
    public viewerService: ViewerService,
    public changeRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    firstValueFrom(this.store.select(selectQueryParams)).then((queryParams) => {
      this.debugMode = queryParams['debug'];
    });

    combineLatest([this.viewerService.currentCaption$, this.captions$])
      .pipe(
        takeUntil(this.destroy$$),
        throttleTime(400, undefined, { leading: true, trailing: true }),
        tap(([currentCaption, captions]) => {
          if (currentCaption && this.autoScroll) {
            const index = captions.findIndex(
              (caption) => caption.id === currentCaption.id
            );

            if (index && this.autoScroll) {
              this.scrollToCaption(currentCaption.id);
            }
          }
        })
      )
      .subscribe();

    const transcript$: Observable<TiptapCaption[][]> = this.captions$.pipe(
      map((captions) => {
        const transcript = generateTranscript(captions);
        this.transcriptNew = JSON.parse(JSON.stringify(transcript));
        return transcript;
      })
    );

    combineLatest([transcript$, this.searchValue$])
      .pipe(
        takeUntil(this.destroy$$),
        throttleTime(250),
        tap(([transcript, searchValue]) => {
          let regex = new RegExp('(' + searchValue + ')', 'gi'); // g = global, i = case insensitive

          const searchFoundInCaptionIdsTemp: string[] = [];

          let markIndex = 0;

          transcript.forEach((paragraph, indexParagraph) => {
            paragraph.forEach((entity, indexCaption) => {
              const matches = entity.text.match(regex);
              if (searchValue.length > 0 && matches?.length) {
                searchFoundInCaptionIdsTemp.push(
                  ...matches.map(() => entity.id)
                );

                // this.transcriptNew[indexParagraph][indexCaption].text =
                //   entity.text.replace(regex, '<mark>$1</mark>');

                this.transcriptNew[indexParagraph][indexCaption].text =
                  entity.text.replace(
                    regex,
                    (text) =>
                      `<mark tabindex="0" class="mark-${markIndex++}">${text}</mark>`
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
    this.autoScroll = false;
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

    const viewportEle = document.getElementById('captions-viewport');
    const captionEle = document.getElementById('caption-' + id);
    const captionParentEle = captionEle?.parentElement;

    if (!viewportEle || !captionEle || !captionParentEle) return;

    // captionEle.scrollIntoView({
    //   behavior: 'smooth',
    //   block: 'center',
    // });

    const containerRect = viewportEle.getBoundingClientRect();
    const targetRect = captionEle.getBoundingClientRect();

    const scrollPosition =
      viewportEle.scrollTop +
      (targetRect.top - containerRect.top) -
      viewportEle.clientHeight / 2 +
      captionEle.clientHeight / 2 +
      viewportEle.clientHeight * 0.2;

    viewportEle.scrollTo({
      top: scrollPosition,
      behavior: 'smooth',
    });
  }

  getSpeakerName(speakerId: string, availableSpeakers: SpeakerEntity[]) {
    return availableSpeakers.find((speaker) => speaker.id === speakerId)?.name;
  }

  onJumpInVideo(caption: TiptapCaption) {
    this.viewerService.onJumpInAudio(caption.start + 1);
  }

  onKeyboardJumpInVideo(event: KeyboardEvent, caption: TiptapCaption) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      this.viewerService.onJumpInAudio(caption.start + 1);
    }
  }

  trackById(index: number, caption: { id: string; speakerId: string }) {
    return caption.id;
  }

  stopAutoscroll() {
    this.autoScroll = false;
  }
}
