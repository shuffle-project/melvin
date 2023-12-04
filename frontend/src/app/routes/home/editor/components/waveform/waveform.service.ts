import { ElementRef, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  Subject,
  combineLatest,
  filter,
  fromEvent,
  startWith,
  takeUntil,
  tap,
  throttleTime,
} from 'rxjs';
import { ColorService } from '../../../../../services/color/color.service';
import { AppState } from '../../../../../store/app.state';
import * as editorSelectors from '../../../../../store/selectors/editor.selector';
import { MediaService } from '../../services/media/media.service';

export interface WaveformConfig {
  barWidth: number;
  barSpace: number;
  height: number;
  valueHeightInPercent: number;
  zoomedRangeInSeconds: number;
  colors: {
    cursor: string;
    played: string;
    unplayed: string;
    range: string;
  };
}

export interface Waveform {
  settings: WaveformCanvasSettings;
  cursor: WaveformCursor;
  range: WaveformRange;
  values: WaveformValue[];
}

export interface WaveformCanvasSettings {
  width: number;
  height: number;
  styleWidth: number;
  styleHeight: number;
  scale: number;
}

export interface WaveformCursor {
  x: number;
  y: number;
  h: number;
  w: number;
  color: string;
}

export interface WaveformRange {
  x: number;
  y: number;
  h: number;
  w: number;
  color: string;
}

export interface WaveformValue {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

@Injectable({
  providedIn: 'root',
})
export class WaveformService {
  public canvasSettingsChanged$ = new Subject<WaveformCanvasSettings>();
  public waveformChanged$ = new Subject<void>();

  private destroy$$ = new Subject<void>();

  private config: WaveformConfig = {
    barWidth: 2,
    barSpace: 1,
    height: 60,
    valueHeightInPercent: 0.9,
    zoomedRangeInSeconds: 30,
    colors: {
      cursor: this.colorService.getCssVariableValue('--color-waveform-cursor'),
      played: this.colorService.getCssVariableValue('--color-waveform-played'),
      unplayed: this.colorService.getCssVariableValue(
        '--color-waveform-unplayed'
      ),
      range: this.colorService.getCssVariableValue(
        '--color-waveform-zoomed-background'
      ),
    },
  };

  private devicePixelRatio = window.devicePixelRatio || 1;
  private barDisplayWidth = this.config.barWidth + this.config.barSpace;

  private hostElement!: ElementRef;
  private canvasSettings!: WaveformCanvasSettings;

  private waveformDataSampledFull!: number[];
  private waveformDataSampledZoomed!: number[];

  public isReady: boolean = false;

  constructor(
    private mediaService: MediaService,
    private colorService: ColorService,
    private store: Store<AppState>
  ) {}

  async init(hostElement: ElementRef): Promise<void> {
    this.destroy$$ = new Subject<void>();

    // Store HostElement to get waveform width after resize updates
    this.hostElement = hostElement;

    // Subscribe to waveform data and resize events
    combineLatest([
      this.store.select(editorSelectors.selectWaveform),
      this.store.select(editorSelectors.selectDuration),
      fromEvent(window, 'resize').pipe(startWith(null)),
    ])
      .pipe(
        takeUntil(this.destroy$$),
        filter(
          ([values, duration]) => values.length > 0 && duration !== undefined
        ),
        throttleTime(100)
      )
      .subscribe(([values, duration]) => {
        this._updateWaveformDataAndSettings(values, duration);
      });

    // Subscribe to current time updates from media-service
    this.mediaService.currentTime$
      .asObservable()
      .pipe(
        takeUntil(this.destroy$$),
        filter(() => this.isReady),
        tap(() => {
          this.waveformChanged$.next();
        })
      )
      .subscribe();
  }

  destroy(): void {
    this.isReady = false;
    this.destroy$$.next();
  }

  _updateWaveformDataAndSettings(values: number[], duration: number): void {
    // Update canvas dimensions
    const { clientWidth } = this.hostElement.nativeElement;
    this.canvasSettings = {
      width: clientWidth * this.devicePixelRatio,
      height: this.config.height * this.devicePixelRatio,
      styleWidth: clientWidth,
      styleHeight: this.config.height,
      scale: this.devicePixelRatio,
    };

    // Sample values for waveforms
    const normalizeTo =
      this.canvasSettings.styleHeight * this.config.valueHeightInPercent;
    const numBars = this.canvasSettings.styleWidth / this.barDisplayWidth;
    const samplesFull = Math.floor(numBars);
    const zoomedRangeFactor =
      duration / 1000 / this.config.zoomedRangeInSeconds;
    const samplesZoomed = Math.floor(zoomedRangeFactor * numBars);
    this.waveformDataSampledFull = this._getSampledWaveformValues(
      values,
      samplesFull,
      normalizeTo
    );
    this.waveformDataSampledZoomed = this._getSampledWaveformValues(
      values,
      samplesZoomed,
      normalizeTo
    );

    // Activate MediaService events
    this.isReady = true;

    // Fire subjects to trigger paint
    this.canvasSettingsChanged$.next(this.canvasSettings);
    this.waveformChanged$.next();
  }

  _getCursor(position: number): WaveformCursor {
    return {
      color: this.config.colors.cursor,
      x: position - 1,
      y: 0,
      w: 3,
      h: this.config.height,
    };
  }

  _getWaveformFull(): Waveform {
    // Variables
    const data = this.waveformDataSampledFull;
    const currentTime = this.mediaService.currentTime$.getValue();
    const duration = this.mediaService.duration$.getValue();
    const width = this.canvasSettings.styleWidth;
    const height = this.canvasSettings.styleHeight;

    // Cursor
    const cursorPosition = (currentTime / duration) * width;
    const cursor = this._getCursor(cursorPosition);

    // Range
    const rangeWidth = (this.config.zoomedRangeInSeconds / duration) * width;
    const halfRangeWidth = rangeWidth / 2;
    let x = Math.max(0, cursorPosition - halfRangeWidth);
    let w = rangeWidth;
    if (x + w > width) {
      x = width - w;
    }
    const range: WaveformRange = {
      x,
      y: 0,
      h: height,
      w, // Math.min(width - x + rangeWidth / 2, rangeWidth),
      color: this.config.colors.range,
    };

    // Values
    const values = new Array(data.length);
    for (let i = 0; i < values.length; i++) {
      const value = data[i];
      const x = i * this.barDisplayWidth;

      const color =
        x <= cursor.x ? this.config.colors.played : this.config.colors.unplayed;

      values[i] = {
        color,
        x,
        y: Math.floor((height - value) / 2),
        w: this.config.barWidth,
        h: value,
      };
    }

    return {
      settings: this.canvasSettings,
      cursor,
      range,
      values,
    };
  }

  _getWaveformZoomed(): Waveform {
    // Variables
    const data = this.waveformDataSampledZoomed;
    const currentTime = this.mediaService.currentTime$.getValue();
    const duration = this.mediaService.duration$.getValue();
    const width = this.canvasSettings.styleWidth;
    const height = this.canvasSettings.styleHeight;

    // Cursor
    const cursor = this._getCursor(width / 2);

    // Range
    const range: WaveformRange = {
      x: 0,
      y: 0,
      h: height,
      w: width,
      color: this.config.colors.range,
    };

    // Values
    const currentValueIndex = (data.length / duration) * currentTime;
    const numBars = Math.floor(width / this.barDisplayWidth);
    const startIndex = Math.floor(currentValueIndex - numBars / 2);

    /**
     * For smooth animation rendering, the fixed waveform grid requires subpixel offsets.
     * Credits to awesome Daniel Grießhaber (https://github.com/dangrie158) for this fix.
     */
    const xOffset = currentValueIndex - numBars / 2 - startIndex;

    const values = new Array(numBars);
    for (let i = 0; i < values.length; i++) {
      const index = startIndex + i;
      const value = index < 0 || index > data.length ? 0 : data[index];

      const x = (i - xOffset) * this.barDisplayWidth;

      const color =
        x <= cursor.x ? this.config.colors.played : this.config.colors.unplayed;

      values[i] = {
        color,
        x,
        y: Math.floor((height - value) / 2),
        w: this.config.barWidth,
        h: value,
      };
    }

    return {
      settings: this.canvasSettings,
      cursor,
      range,
      values,
    };
  }

  getWaveform(zoomed: boolean): Waveform {
    return zoomed ? this._getWaveformZoomed() : this._getWaveformFull();
  }

  getZoomedRangeInSeconds(): number {
    return this.config.zoomedRangeInSeconds;
  }

  _getSampledWaveformValues(
    values: number[],
    numSamples: number,
    normalizeTo: number
  ): number[] {
    if (values.length === 0 || numSamples === 0) {
      return [];
    }

    const blockSize = values.length / numSamples; // Number of samples in each subdivision

    const filteredData = new Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      /**
       * Round array index on each iteration to avoid an offset and provide upsampling functionality
       */
      const start = Math.round(i * blockSize);
      const end = Math.round(start + blockSize);

      const slice = values.slice(start, end + 1);

      const average = slice.reduce((a, b) => a + b) / slice.length;

      filteredData[i] = average;
    }

    // Normalize values
    const maximum = Math.max(...filteredData) + 2;
    const multiplier = normalizeTo / maximum;
    const normalized = filteredData.map(
      (n) =>
        // parse to integer and use a minimum value of 2
        Math.round(n * multiplier) + 2
    );

    return normalized;
  }
}
