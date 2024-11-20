import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { filter, fromEvent, merge, Subject, takeUntil } from 'rxjs';
import { environment } from '../../../../../../../environments/environment';
import { MediaService } from '../../../services/media/media.service';
import { WaveformCanvasSettings, WaveformService } from '../waveform.service';


@Component({
    selector: 'app-waveform-canvas',
    templateUrl: './waveform-canvas.component.html',
    styleUrls: ['./waveform-canvas.component.scss'],
    imports: []
})
export class WaveformCanvasComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
  @Input() isZoomed: boolean = false;
  @Input() hidden: boolean = false;
  @Input() showRange: boolean = false;

  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;

  private destroy$$ = new Subject<void>();
  private hiddenChanged$ = new Subject<boolean>();
  private showRangeChanged$ = new Subject<boolean>();
  private ctx!: CanvasRenderingContext2D;

  public isReady: boolean = false;

  get interactive(): boolean {
    return environment.features.timeNavigation && !this.isZoomed;
  }

  constructor(
    private waveformService: WaveformService,
    private mediaService: MediaService
  ) {}

  ngOnInit(): void {
    this.waveformService.canvasSettingsChanged$
      .pipe(takeUntil(this.destroy$$))
      .subscribe((settings: WaveformCanvasSettings) =>
        this.updateCanvasSettings(settings)
      );

    merge(
      this.waveformService.waveformChanged$,
      this.hiddenChanged$,
      this.showRangeChanged$
    )
      .pipe(
        takeUntil(this.destroy$$),
        filter(() => !this.hidden && this.waveformService.isReady)
      )
      .subscribe(() => {
        this.drawCanvas();
        this.isReady = true;
      });
  }

  ngAfterViewInit(): void {
    this.ctx = this.canvas.nativeElement.getContext(
      '2d'
    ) as CanvasRenderingContext2D;

    if (!this.isZoomed) {
      this.subscribeToMouseEvents();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['showRange']) {
      this.showRangeChanged$.next(changes['showRange'].currentValue);
    }
    if (changes['hidden']) {
      this.hiddenChanged$.next(changes['hidden'].currentValue);
    }
  }

  ngOnDestroy(): void {
    this.destroy$$.next();
    this.isReady = false;
  }

  updateCanvasSettings(settings: WaveformCanvasSettings): void {
    this.canvas.nativeElement.width = settings.width;
    this.canvas.nativeElement.height = settings.height;
    this.canvas.nativeElement.style.width = `${settings.styleWidth}px`;
    this.canvas.nativeElement.style.height = `${settings.styleHeight}px`;

    this.ctx.scale(settings.scale, settings.scale);
  }

  drawCanvas(): void {
    const data = this.waveformService.getWaveform(this.isZoomed);

    // Reset canvas
    this.ctx.clearRect(0, 0, data.settings.width, data.settings.height);

    if (this.showRange) {
      // Range
      this.ctx.fillStyle = data.range.color;
      this.ctx.fillRect(data.range.x, data.range.y, data.range.w, data.range.h);
    }

    // Values
    for (const value of data.values) {
      this.ctx.fillStyle = value.color;
      this.ctx.fillRect(value.x, value.y, value.w, value.h);
    }

    // Cursor
    this.ctx.fillStyle = data.cursor.color;
    this.ctx.fillRect(
      data.cursor.x,
      data.cursor.y,
      data.cursor.w,
      data.cursor.h
    );
  }

  subscribeToMouseEvents(): void {
    let mouseDownOnCanvas = false;

    fromEvent(this.canvas.nativeElement, 'mousedown')
      .pipe(takeUntil(this.destroy$$))
      .subscribe((event) => {
        this.onCanvasEvent(event as MouseEvent);
        mouseDownOnCanvas = true;
      });

    merge(
      fromEvent(this.canvas.nativeElement, 'mouseup'),
      fromEvent(this.canvas.nativeElement, 'mouseout')
    )
      .pipe(
        takeUntil(this.destroy$$),
        filter(() => mouseDownOnCanvas)
      )
      .subscribe(() => {
        mouseDownOnCanvas = false;
      });

    fromEvent(this.canvas.nativeElement, 'mousemove')
      .pipe(
        takeUntil(this.destroy$$),
        filter(() => mouseDownOnCanvas)
      )
      .subscribe((event) => {
        this.onCanvasEvent(event as MouseEvent);
      });
  }

  onCanvasEvent(event: MouseEvent) {
    if (!environment.features.timeNavigation) {
      return;
    }

    const { left, width } = this.canvas.nativeElement.getBoundingClientRect();
    const { clientX } = event;
    const position = Math.min(Math.max(clientX - left, 0), width);
    const duration = this.mediaService.duration$.getValue();

    this.mediaService.seekToTime((duration / width) * position, true);
  }
}
