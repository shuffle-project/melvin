import { Component, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { WaveformService } from './waveform.service';

@Component({
  selector: 'app-waveform',
  templateUrl: './waveform.component.html',
  styleUrls: ['./waveform.component.scss'],
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
