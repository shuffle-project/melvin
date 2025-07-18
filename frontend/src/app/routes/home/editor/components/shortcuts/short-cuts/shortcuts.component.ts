import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import { fromEvent, Subject, takeUntil } from 'rxjs';
import { AppState } from 'src/app/store/app.state';
import * as editorActions from '../../../../../../store/actions/editor.actions';
import { MediaService } from '../../../service/media/media.service';

@Component({
  selector: 'app-shortcuts',
  imports: [MatExpansionModule, MatIconModule],
  templateUrl: './shortcuts.component.html',
  styleUrl: './shortcuts.component.scss',
})
export class ShortcutsComponent implements OnDestroy, OnInit {
  isMac = false;
  currentTime = 0;

  // key combinations
  togglePlayPauseKeys = '';
  rewind5SecondsKeys = '';
  skip5SecondsKeys = '';
  jumpToWordKeys = '';
  jumpoToWordMouseKeys = '';

  private destroy$$ = new Subject<void>();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private store: Store<AppState>,
    private mediaService: MediaService
  ) {}

  ngOnInit() {
    this.isMac =
      isPlatformBrowser(this.platformId) && /Mac/i.test(navigator.userAgent);

    const localizedCtrl = $localize.locale?.includes('de') ? 'Strg' : 'Ctrl';

    if (this.isMac) {
      this.togglePlayPauseKeys = `${localizedCtrl} + Cmd + K`;
      this.rewind5SecondsKeys = `${localizedCtrl} + Cmd + J`;
      this.skip5SecondsKeys = `${localizedCtrl} + Cmd + L`;
      this.jumpToWordKeys = `Cmd + Enter`;
      this.jumpoToWordMouseKeys = `Cmd +`;
    } else {
      this.togglePlayPauseKeys = `${localizedCtrl} + Alt + K`;
      this.rewind5SecondsKeys = `${localizedCtrl} + Alt + J`;
      this.skip5SecondsKeys = `${localizedCtrl} + Alt + L`;
      this.jumpToWordKeys = `${localizedCtrl} + Enter`;
      this.jumpoToWordMouseKeys = `${localizedCtrl} +`;
    }

    this.mediaService.currentTime$.pipe().subscribe((time) => {
      this.currentTime = Math.floor(time / 1000);
    });

    fromEvent<KeyboardEvent>(window, 'keydown', { capture: true })
      .pipe(takeUntil(this.destroy$$))
      .subscribe((event) => {
        console.log('Keyboard event - fromEvent:', event);
        this.handleKeyboardEvent(event);
      });
  }

  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.isMac && !event.metaKey) return;
    if (!this.isMac && !event.ctrlKey) return;

    if (this.isMac) {
      let keyCombination = '';
      if (event.ctrlKey) keyCombination += 'Ctrl+';
      if (event.metaKey) keyCombination += 'Cmd+';

      keyCombination = keyCombination += event.key.toLowerCase();

      switch (keyCombination) {
        case 'Ctrl+Cmd+k':
          event.preventDefault();
          this.store.dispatch(editorActions.ePlayPauseUser());
          break;
        case 'Ctrl+Cmd+l':
          event.preventDefault();
          this.mediaService.skipForward(5000);
          break;
        case 'Ctrl+Cmd+j':
          event.preventDefault();
          this.mediaService.skipBackward(5000);
          break;
        case 'Ctrl+Cmd+enter':
          event.preventDefault();
          this.jumpToWordKeyboard();
          break;
        case 'Cmd+enter':
          event.preventDefault();
          this.jumpToWordKeyboard();
          break;
      }
    } else {
      let keyCombination = '';
      if (event.ctrlKey) keyCombination += 'Ctrl+';
      if (event.altKey) keyCombination += 'Alt+';

      keyCombination = keyCombination += event.key.toLowerCase();

      switch (keyCombination) {
        case 'Ctrl+Alt+k':
          event.preventDefault();
          this.store.dispatch(editorActions.ePlayPauseUser());
          break;
        case 'Ctrl+Alt+l':
          event.preventDefault();
          this.mediaService.skipForward(5000);
          break;
        case 'Ctrl+Alt+j':
          event.preventDefault();
          this.mediaService.skipBackward(5000);
          break;
        case 'Ctrl+Alt+enter':
          event.preventDefault();
          this.jumpToWordKeyboard();
          break;
        case 'Ctrl+enter':
          event.preventDefault();
          this.jumpToWordKeyboard();
          break;
      }
    }
  }

  jumpToWordKeyboard() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    let node = range.startContainer;

    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode as HTMLElement;
    }

    if (
      node instanceof HTMLElement &&
      node.tagName.toLowerCase() === 'span' &&
      node.classList.length > 0 &&
      node.classList[0].includes('time-')
    ) {
      const start = node.attributes.getNamedItem('data-start')?.value;

      if (start) {
        this.mediaService.seekToTime(+start, false);
      }
    }
  }

  ngOnDestroy() {
    this.destroy$$.next();
  }
}
