import { Component, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { WaveformService } from './waveform.service';
import { WaveformCaptionsComponent } from './waveform-captions/waveform-captions.component';
import { WaveformCanvasComponent } from './waveform-canvas/waveform-canvas.component';

@Component({
    selector: 'app-waveform',
    templateUrl: './waveform.component.html',
    styleUrls: ['./waveform.component.scss'],
    standalone: true,
    imports: [WaveformCanvasComponent, WaveformCaptionsComponent],
})
export class WaveformComponent implements OnInit, OnDestroy {
  @Input() zoomActivated: boolean = false;

  private destroy$$ = new Subject<void>();

  constructor(
    private hostElement: ElementRef,
    private waveformService: WaveformService
  ) {}

  ngOnInit() {
    this.waveformService.init(this.hostElement);
  }

  ngOnDestroy(): void {
    this.destroy$$.next();
    this.waveformService.destroy();
  }
}
