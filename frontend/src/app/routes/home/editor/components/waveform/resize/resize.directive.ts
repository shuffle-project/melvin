import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
} from '@angular/core';

export interface AppResizeEvent {
  type: 'start' | 'mid' | 'end';
  delta: number;
}

export interface AppSubmitResizeEvent {
  type: 'start' | 'mid' | 'end';
}

@Directive({
    selector: '[appResize]',
    standalone: true,
})
export class ResizeDirective {
  // this event will give a live update, how the div is resized, always in relation to the previous event
  @Output() resizeEvent = new EventEmitter<AppResizeEvent>();

  // this event will be triggered if the resize prcess is over
  @Output() submitResizeEvent = new EventEmitter<AppSubmitResizeEvent>();

  private resizeWidth = 10; // x pixels on left and right to risize

  //helper
  private mousedownOnStart = false;
  private mousedownOnMid = false;
  private mousedownOnEnd = false;
  private previousCursorPosition: number = 0;

  // mousemove on window to resize div
  @HostListener('window:mousemove', ['$event'])
  mousemoveWindow(event: MouseEvent) {
    const delta = event.clientX - this.previousCursorPosition;
    //only if there is movement on the x axis
    if (delta !== 0) {
      //mousedown on start
      if (this.mousedownOnStart) {
        this.resizeEvent.emit({
          type: 'start',
          delta,
        });
        // reset cursorPosition
        this.previousCursorPosition = event.clientX;
      }

      //mousedown on mid
      else if (this.mousedownOnMid) {
        this.resizeEvent.emit({
          type: 'mid',
          delta,
        });
        // reset cursorPosition
        this.previousCursorPosition = event.clientX;
      }

      //mousedown on end
      else if (this.mousedownOnEnd) {
        this.resizeEvent.emit({
          type: 'end',
          delta,
        });
        // reset cursorPosition
        this.previousCursorPosition = event.clientX;
      }
    }
  }

  // mousemove show special cursor on specified areas
  @HostListener('mousemove', ['$event'])
  mousemoveDiv(event: MouseEvent) {
    this.el.nativeElement.style['user-select'] = 'none';

    if (event.offsetX < this.resizeWidth) {
      // cursor on first pixels of div
      this.el.nativeElement.style.cursor = 'col-resize';
    } else if (
      event.offsetX >
      this.el.nativeElement.clientWidth - this.resizeWidth
    ) {
      // cursor on last pixels of div
      this.el.nativeElement.style.cursor = 'col-resize';
    } else {
      // default cursor
      this.el.nativeElement.style.cursor = 'move';
    }
  }

  // mousedown only on specified areas
  @HostListener('mousedown', ['$event'])
  mousedown(event: MouseEvent) {
    if (event.offsetX < this.resizeWidth) {
      // mouse down on start of div
      this.previousCursorPosition = event.clientX;
      this.mousedownOnStart = true;
    } else if (
      event.offsetX >
      this.el.nativeElement.clientWidth - this.resizeWidth
    ) {
      // mouse down on end of div
      this.previousCursorPosition = event.clientX;
      this.mousedownOnEnd = true;
    } else {
      // mouse down on mid
      this.previousCursorPosition = event.clientX;
      this.mousedownOnMid = true;
    }
  }

  //mouseup everywhere
  @HostListener('window:mouseup', ['$event'])
  mouseup(event: MouseEvent) {
    if (this.mousedownOnStart) {
      this.mousedownOnStart = false;
      this.submitResizeEvent.emit({ type: 'start' });
    }
    if (this.mousedownOnMid) {
      this.mousedownOnMid = false;
      this.submitResizeEvent.emit({ type: 'mid' });
    }
    if (this.mousedownOnEnd) {
      this.mousedownOnEnd = false;
      this.submitResizeEvent.emit({ type: 'end' });
    }
  }

  constructor(private el: ElementRef) {}
}
