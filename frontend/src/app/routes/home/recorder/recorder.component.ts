import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-recorder',
  templateUrl: './recorder.component.html',
  styleUrls: ['./recorder.component.scss'],
})
export class RecorderComponent {
  @ViewChild('webcamVideo', { static: false })
  webCamVideo!: ElementRef<HTMLVideoElement>;

  @ViewChild('screenSharingVideo', { static: false })
  screenSharingVideo!: ElementRef<HTMLVideoElement>;

  onStartWebcam() {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        this.webCamVideo.nativeElement.srcObject = stream;
        this.webCamVideo.nativeElement.play();
      })
      .catch((err) => {
        console.error(`An error occurred: ${err}`);
      });
  }

  onStartScreenSharing() {
    navigator.mediaDevices
      .getDisplayMedia({ video: true, audio: true })
      .then((stream) => {
        this.screenSharingVideo.nativeElement.srcObject = stream;
        this.screenSharingVideo.nativeElement.play();
      })
      .catch((err) => {
        console.error(`An error occurred: ${err}`);
      });
  }
}
