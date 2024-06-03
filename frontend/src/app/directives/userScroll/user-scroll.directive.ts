import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
} from '@angular/core';

@Directive({
  selector: '[appUserScroll]',
  standalone: true,
})
export class UserScrollDirective {
  @Output() appUserScroll = new EventEmitter<void>();

  constructor(private elRef: ElementRef<HTMLElement>) {}

  @HostListener('mousewheel', ['$event'])
  public onMousewheel(event: MouseEvent) {
    this.appUserScroll.emit();
  }

  @HostListener('mousedown', ['$event'])
  public onMousedown(event: MouseEvent) {
    if (event.target) {
      const targetHtmlElement = event.target as HTMLElement;
      if (targetHtmlElement === this.elRef.nativeElement) {
        const clickOnScrollbar =
          event.offsetX > targetHtmlElement.clientWidth ||
          event.offsetY > targetHtmlElement.clientHeight;
        if (clickOnScrollbar) {
          this.appUserScroll.emit();
        }
      }
    }
  }

  @HostListener('keydown', ['$event'])
  public onKeydown(event: KeyboardEvent) {
    const stopScrollingOnKeys = [
      'ArrowDown',
      'ArrowUp',
      ' ',
      'PageDown',
      'PageUp',
      'End',
      'Home',
    ];
    if (stopScrollingOnKeys.includes(event.key)) {
      this.appUserScroll.emit();
    }
  }
}
