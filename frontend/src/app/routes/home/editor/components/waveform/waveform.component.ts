import { Component, Input, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { WaveformCanvasComponent } from './waveform-canvas/waveform-canvas.component';
import { WaveformService } from './waveform.service';

@Component({
  selector: 'app-waveform',
  templateUrl: './waveform.component.html',
  styleUrls: ['./waveform.component.scss'],
  imports: [WaveformCanvasComponent],
})
export class WaveformComponent implements OnDestroy {
  @Input() zoomActivated: boolean = false;

  private destroy$$ = new Subject<void>();

  constructor(private waveformService: WaveformService) {}
  ngOnInit(): void {
    this.waveformService.init();
  }

  ngOnDestroy(): void {
    this.destroy$$.next();
    this.waveformService.destroy();
  }
}
