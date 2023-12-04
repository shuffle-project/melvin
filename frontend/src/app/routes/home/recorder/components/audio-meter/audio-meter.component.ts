import { Component, Input, OnDestroy, OnInit } from '@angular/core';

@Component({
    selector: 'app-audio-meter',
    templateUrl: './audio-meter.component.html',
    styleUrls: ['./audio-meter.component.scss'],
    standalone: true,
})
export class AudioMeterComponent implements OnInit, OnDestroy {
  @Input({ required: true }) mediaStream!: MediaStream;

  destroyed = false;
  volumeLevel = 0;

  constructor() {}

  ngOnInit(): void {
    const audioContext = new AudioContext();
    const mediaStreamAudioSourceNode = audioContext.createMediaStreamSource(
      this.mediaStream
    );
    const analyserNode = audioContext.createAnalyser();
    mediaStreamAudioSourceNode.connect(analyserNode);

    const pcmData = new Float32Array(analyserNode.fftSize);
    const onFrame = () => {
      // stop after destroyed
      if (this.destroyed) return;

      analyserNode.getFloatTimeDomainData(pcmData);
      let sumSquares = 0.0;
      for (const amplitude of pcmData) {
        sumSquares += amplitude * amplitude;
      }
      const newVolumeLevel = Math.sqrt(sumSquares / pcmData.length) * 750;
      this.volumeLevel =
        newVolumeLevel > 100 ? 100 : Number(newVolumeLevel.toFixed());
      window.requestAnimationFrame(onFrame);
    };
    window.requestAnimationFrame(onFrame);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
  }
}
