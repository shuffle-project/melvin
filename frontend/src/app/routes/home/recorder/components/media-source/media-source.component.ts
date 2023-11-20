import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SourceObj } from '../../recorder.interfaces';

@Component({
  selector: 'app-media-source',
  templateUrl: './media-source.component.html',
  styleUrls: ['./media-source.component.scss'],
})
export class MediaSourceComponent implements OnInit {
  @Input({ required: true }) readonly!: boolean;
  @Input({ required: true }) mediaSource!: SourceObj;

  @Output() removeMediaSourceElement = new EventEmitter<void>();

  constructor() {}

  meter = 0;

  ngOnInit() {
    if (this.mediaSource.type === 'videoinput') return;

    const audioContext = new AudioContext();
    const mediaStreamAudioSourceNode = audioContext.createMediaStreamSource(
      this.mediaSource.mediaStream
    );
    const analyserNode = audioContext.createAnalyser();
    mediaStreamAudioSourceNode.connect(analyserNode);

    const pcmData = new Float32Array(analyserNode.fftSize);

    // https://jameshfisher.com/2021/01/18/measuring-audio-volume-in-javascript/

    // window.requestAnimationFrame(onFrame);
    // window.requestAnimationFrame(onFrame);

    setInterval(() => {
      analyserNode.getFloatTimeDomainData(pcmData);
      let sumSquares = 0.0;
      for (const amplitude of pcmData) {
        sumSquares += amplitude * amplitude;
      }
      this.meter = Math.sqrt(sumSquares / pcmData.length) * 100;
      console.log(this.meter);
    }, 1000);
  }

  onRemoveMediaSource() {
    this.removeMediaSourceElement.emit();
  }
}
