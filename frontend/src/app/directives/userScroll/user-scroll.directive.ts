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

  @HostListener('wheel', ['$event'])
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
          event.offsetY > targetHtmlElement.clientHeight ||
          event.offsetX > targetHtmlElement.offsetWidth - 16;

        // console.log(event.offsetX, targetHtmlElement.clientWidth);
        // console.log(event.offsetX > targetHtmlElement.clientWidth);
        // console.log(targetHtmlElement.offsetWidth);
        // console.log(targetHtmlElement.scrollWidth);
        // console.log(targetHtmlElement.clientWidth);

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
